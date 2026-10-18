package eatings

import (
	"context"
	"encoding/json"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
)

type Eating struct {
	ID        int64     `json:"id"`
	Day       string    `json:"day"`
	Meal      string    `json:"meal"`
	Portion   float64   `json:"portion"`
	DishID    *int64    `json:"dishId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	dishes.FoodValue
	DishSnapshot dishes.Snapshot `json:"dishSnapshot"`
}

type Meal struct {
	dishes.FoodValue
	Eatings []Eating `json:"eatings"`
}

type Daily struct {
	Day string `json:"day"`
	dishes.FoodValue
	Meals map[string]*Meal `json:"meals"`
}

type CreateInput struct {
	ClientRequestID string  `json:"clientRequestId"`
	DishID          int64   `json:"dishId"`
	Day             string  `json:"day"`
	Meal            string  `json:"meal"`
	Portion         float64 `json:"portion"`
}

type Service struct{ db *database.Database }

func New(db *database.Database) *Service { return &Service{db: db} }

func ValidDay(day string) bool {
	parsed, err := time.Parse("2006-01-02", day)
	return err == nil && len(day) == 10 && parsed.Year() >= 1 && parsed.Format("2006-01-02") == day
}

func validPortion(portion float64) bool {
	return portion > 0 && !math.IsInf(portion, 0) && !math.IsNaN(portion)
}

func scaled(value dishes.FoodValue, portion float64) (dishes.FoodValue, error) {
	result := dishes.FoodValue{Proteins: value.Proteins * (portion / 100), Fats: value.Fats * (portion / 100), Carbs: value.Carbs * (portion / 100), Calories: value.Calories * (portion / 100)}
	for _, n := range []float64{result.Proteins, result.Fats, result.Carbs, result.Calories} {
		if n < 0 || math.IsInf(n, 0) || math.IsNaN(n) {
			return result, &dishes.ValidationError{Path: "portion", Code: "invalid_number"}
		}
	}

	return result, nil
}

const columns = `id,day::text,meal,portion,dish_id,created_at,updated_at,proteins,fats,carbs,calories,dish_name,dish_icon,dish_proteins,dish_fats,dish_carbs,dish_calories`

func scan(row pgx.Row) (Eating, error) {
	var e Eating
	s := &e.DishSnapshot
	err := row.Scan(&e.ID, &e.Day, &e.Meal, &e.Portion, &e.DishID, &e.CreatedAt, &e.UpdatedAt, &e.Proteins, &e.Fats, &e.Carbs, &e.Calories, &s.Name, &s.Icon, &s.Proteins, &s.Fats, &s.Carbs, &s.Calories)
	e.CreatedAt = e.CreatedAt.UTC()
	e.UpdatedAt = e.UpdatedAt.UTC()
	if errors.Is(err, pgx.ErrNoRows) {
		return e, dishes.ErrNotFound
	}

	return e, err
}

func (s *Service) Create(ctx context.Context, user string, input CreateInput) (Eating, error) {
	if input.DishID < 1 || input.DishID > 9007199254740991 {
		return Eating{}, &dishes.ValidationError{Path: "dishId", Code: "invalid_id"}
	}
	if !ValidDay(input.Day) {
		return Eating{}, &dishes.ValidationError{Path: "day", Code: "invalid_day"}
	}
	if input.Meal != "breakfast" && input.Meal != "lunch" && input.Meal != "dinner" && input.Meal != "snack" {
		return Eating{}, &dishes.ValidationError{Path: "meal", Code: "invalid_meal"}
	}
	if !validPortion(input.Portion) {
		return Eating{}, &dishes.ValidationError{Path: "portion", Code: "invalid_weight"}
	}

	input.ClientRequestID = strings.ToLower(input.ClientRequestID)
	normalized, err := json.Marshal(input)
	if err != nil {
		return Eating{}, err
	}

	var result Eating
	err = s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, user+":create_eating:"+input.ClientRequestID); err != nil {
			return err
		}

		var previous []byte
		var same bool
		err := tx.QueryRow(ctx, `SELECT request_body=$3::jsonb,response_body FROM app.creation_requests WHERE user_id=$1 AND operation='create_eating' AND request_id=$2`, user, input.ClientRequestID, normalized).Scan(&same, &previous)
		if err == nil {
			if !same {
				return dishes.ErrConflict
			}
			return json.Unmarshal(previous, &result)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}

		// Одна строка содержит всё состояние блюда: имя, иконка и КБЖУ берутся из одной версии MVCC.
		var snapshot dishes.Snapshot
		err = tx.QueryRow(ctx, `SELECT name,icon,proteins,fats,carbs,calories FROM app.dishes WHERE id=$1`, input.DishID).Scan(&snapshot.Name, &snapshot.Icon, &snapshot.Proteins, &snapshot.Fats, &snapshot.Carbs, &snapshot.Calories)
		if errors.Is(err, pgx.ErrNoRows) {
			return dishes.ErrNotFound
		}
		if err != nil {
			return err
		}

		value, err := scaled(snapshot.FoodValue, input.Portion)
		if err != nil {
			return err
		}

		result, err = scan(tx.QueryRow(ctx, `INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_icon,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING `+columns, user, input.DishID, input.Day, input.Meal, input.Portion, snapshot.Name, snapshot.Icon, snapshot.Proteins, snapshot.Fats, snapshot.Carbs, snapshot.Calories, value.Proteins, value.Fats, value.Carbs, value.Calories))
		if err != nil {
			return err
		}

		body, err := json.Marshal(result)
		if err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `INSERT INTO app.creation_requests(user_id,operation,request_id,request_body,response_body) VALUES($1,'create_eating',$2,$3,$4)`, user, input.ClientRequestID, normalized, body)
		return err
	})

	return result, err
}

func (s *Service) Daily(ctx context.Context, user, day string) (Daily, error) {
	result := Daily{Day: day, Meals: map[string]*Meal{}}
	for _, name := range []string{"breakfast", "lunch", "dinner", "snack"} {
		result.Meals[name] = &Meal{Eatings: make([]Eating, 0)}
	}

	err := s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		rows, err := tx.Query(ctx, `SELECT `+columns+` FROM app.eatings WHERE user_id=$1 AND day=$2::date ORDER BY id`, user, day)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			eating, err := scan(rows)
			if err != nil {
				return err
			}
			meal := result.Meals[eating.Meal]
			meal.Eatings = append(meal.Eatings, eating)
			meal.Proteins += eating.Proteins
			meal.Fats += eating.Fats
			meal.Carbs += eating.Carbs
			meal.Calories += eating.Calories
			result.Proteins += eating.Proteins
			result.Fats += eating.Fats
			result.Carbs += eating.Carbs
			result.Calories += eating.Calories
		}

		return rows.Err()
	})

	return result, err
}

func (s *Service) Update(ctx context.Context, user string, id int64, portion float64) (Eating, error) {
	if !validPortion(portion) {
		return Eating{}, &dishes.ValidationError{Path: "portion", Code: "invalid_weight"}
	}

	var result Eating
	err := s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		previous, err := scan(tx.QueryRow(ctx, `SELECT `+columns+` FROM app.eatings WHERE id=$1 FOR UPDATE`, id))
		if err != nil {
			return err
		}
		value, err := scaled(previous.DishSnapshot.FoodValue, portion)
		if err != nil {
			return err
		}

		result, err = scan(tx.QueryRow(ctx, `UPDATE app.eatings SET portion=$2,proteins=$3,fats=$4,carbs=$5,calories=$6,updated_at=now() WHERE id=$1 RETURNING `+columns, id, portion, value.Proteins, value.Fats, value.Carbs, value.Calories))
		return err
	})

	return result, err
}

func (s *Service) Delete(ctx context.Context, user string, id int64) error {
	return s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		result, err := tx.Exec(ctx, `DELETE FROM app.eatings WHERE id=$1`, id)
		if err != nil {
			return err
		}
		if result.RowsAffected() == 0 {
			return dishes.ErrNotFound
		}

		return nil
	})
}
