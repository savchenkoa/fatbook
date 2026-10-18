package dishes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
)

var (
	ErrNotFound = errors.New("dish not found")
	ErrConflict = errors.New("idempotency conflict")
	ErrReadOnly = errors.New("read only dish")
)

type ValidationError struct{ Path, Code string }

func (e *ValidationError) Error() string { return "invalid recipe field" }

type FoodValue struct {
	Proteins float64 `json:"proteins"`
	Fats     float64 `json:"fats"`
	Carbs    float64 `json:"carbs"`
	Calories float64 `json:"calories"`
}

func (v FoodValue) scale(weight float64) FoodValue {
	return FoodValue{v.Proteins * (weight / 100), v.Fats * (weight / 100), v.Carbs * (weight / 100), v.Calories * (weight / 100)}
}

func (v FoodValue) valid() bool {
	for _, n := range []float64{v.Proteins, v.Fats, v.Carbs, v.Calories} {
		if n < 0 || math.IsNaN(n) || math.IsInf(n, 0) {
			return false
		}
	}

	return true
}

type Summary struct {
	ID             int64     `json:"id"`
	Name           string    `json:"name"`
	Icon           *string   `json:"icon"`
	SpaceID        *int64    `json:"spaceId"`
	DefaultPortion *float64  `json:"defaultPortion"`
	CookedWeight   *float64  `json:"cookedWeight"`
	HasIngredients bool      `json:"hasIngredients"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	FoodValue
}

type Snapshot struct {
	Name string  `json:"name"`
	Icon *string `json:"icon"`
	FoodValue
}

type Ingredient struct {
	ID      int64   `json:"id"`
	DishID  int64   `json:"dishId"`
	Portion float64 `json:"portion"`
	FoodValue
	SourceSnapshot Snapshot `json:"sourceSnapshot"`
}

type Dish struct {
	Summary
	Ingredients []Ingredient `json:"ingredients"`
}

type IngredientInput struct {
	DishID  int64   `json:"dishId"`
	Portion float64 `json:"portion"`
}

type RecipeInput struct {
	Name           string            `json:"name"`
	Icon           *string           `json:"icon"`
	DefaultPortion *float64          `json:"defaultPortion"`
	CookedWeight   float64           `json:"cookedWeight"`
	Ingredients    []IngredientInput `json:"ingredients"`
}

type CreateInput struct {
	ClientRequestID string `json:"clientRequestId"`
	RecipeInput
}

type Service struct{ db *database.Database }

func New(db *database.Database) *Service { return &Service{db: db} }

const summaryColumns = `id,name,icon,space_id,default_portion,cooked_weight,(cooked_weight IS NOT NULL),created_at,updated_at,proteins,fats,carbs,calories`

func scanSummary(row pgx.Row) (Summary, error) {
	var d Summary
	err := row.Scan(&d.ID, &d.Name, &d.Icon, &d.SpaceID, &d.DefaultPortion, &d.CookedWeight, &d.HasIngredients, &d.CreatedAt, &d.UpdatedAt, &d.Proteins, &d.Fats, &d.Carbs, &d.Calories)
	d.CreatedAt = d.CreatedAt.UTC()
	d.UpdatedAt = d.UpdatedAt.UTC()
	if errors.Is(err, pgx.ErrNoRows) {
		return d, ErrNotFound
	}

	return d, err
}

func read(ctx context.Context, tx pgx.Tx, id int64) (Dish, error) {
	var d Dish
	var err error
	d.Summary, err = scanSummary(tx.QueryRow(ctx, `SELECT `+summaryColumns+` FROM app.dishes WHERE id=$1 AND deleted_at IS NULL`, id))
	if err != nil {
		return d, err
	}

	d.Ingredients = make([]Ingredient, 0)
	rows, err := tx.Query(ctx, `SELECT id,dish_id,portion,proteins,fats,carbs,calories,source_name,source_icon,source_proteins,source_fats,source_carbs,source_calories FROM app.ingredients WHERE recipe_id=$1 ORDER BY dish_id`, id)
	if err != nil {
		return d, err
	}
	defer rows.Close()

	for rows.Next() {
		var i Ingredient
		s := &i.SourceSnapshot
		if err := rows.Scan(&i.ID, &i.DishID, &i.Portion, &i.Proteins, &i.Fats, &i.Carbs, &i.Calories, &s.Name, &s.Icon, &s.Proteins, &s.Fats, &s.Carbs, &s.Calories); err != nil {
			return d, err
		}
		d.Ingredients = append(d.Ingredients, i)
	}

	return d, rows.Err()
}

func (s *Service) Get(ctx context.Context, user string, id int64) (Dish, error) {
	var d Dish

	err := s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		// Состав читается отдельным запросом; блокировка не даёт PUT заменить
		// его между чтением заголовка и ингредиентов. Каталог не редактируется.
		if _, err := tx.Exec(ctx, `SELECT id FROM app.dishes WHERE id=$1 AND deleted_at IS NULL AND cooked_weight IS NOT NULL FOR SHARE`, id); err != nil {
			return err
		}

		var err error
		d, err = read(ctx, tx, id)
		return err
	})

	return d, err
}

func ingredientPath(index int) string { return fmt.Sprintf("ingredients[%d].dishId", index) }

func positive(n float64) bool { return n > 0 && !math.IsNaN(n) && !math.IsInf(n, 0) }

func validate(input RecipeInput) (map[int64]int, error) {
	if n := utf8.RuneCountInString(input.Name); n < 1 || n > 100 {
		return nil, &ValidationError{"name", "invalid_length"}
	}
	if !positive(input.CookedWeight) {
		return nil, &ValidationError{"cookedWeight", "invalid_weight"}
	}
	if input.DefaultPortion != nil && !positive(*input.DefaultPortion) {
		return nil, &ValidationError{"defaultPortion", "invalid_weight"}
	}
	if len(input.Ingredients) < 1 || len(input.Ingredients) > 100 {
		return nil, &ValidationError{"ingredients", "invalid_count"}
	}

	positions := map[int64]int{}
	for index, item := range input.Ingredients {
		if item.DishID < 1 || item.DishID > 9007199254740991 {
			return nil, &ValidationError{ingredientPath(index), "invalid_id"}
		}
		if !positive(item.Portion) {
			return nil, &ValidationError{fmt.Sprintf("ingredients[%d].portion", index), "invalid_weight"}
		}
		if _, exists := positions[item.DishID]; exists {
			return nil, &ValidationError{ingredientPath(index), "duplicate_source"}
		}
		positions[item.DishID] = index
	}

	return positions, nil
}

func prepareIngredients(ctx context.Context, tx pgx.Tx, input RecipeInput, positions map[int64]int, previous []Ingredient) ([]Ingredient, FoodValue, error) {
	snapshots := make(map[int64]Snapshot, len(previous))
	for _, item := range previous {
		snapshots[item.DishID] = item.SourceSnapshot
	}

	ingredients := make([]Ingredient, 0, len(input.Ingredients))
	total := FoodValue{}
	for _, item := range input.Ingredients {
		index := positions[item.DishID]
		source, err := scanSummary(tx.QueryRow(ctx, `SELECT `+summaryColumns+` FROM app.dishes WHERE id=$1 AND deleted_at IS NULL`, item.DishID))
		if err != nil {
			return nil, FoodValue{}, err
		}
		if source.HasIngredients {
			return nil, FoodValue{}, &ValidationError{ingredientPath(index), "nested_recipe"}
		}
		snapshot, exists := snapshots[item.DishID]
		if !exists {
			snapshot = Snapshot{Name: source.Name, Icon: source.Icon, FoodValue: source.FoodValue}
		}

		value := snapshot.FoodValue.scale(item.Portion)
		if !snapshot.FoodValue.valid() || !value.valid() {
			return nil, FoodValue{}, &ValidationError{ingredientPath(index), "invalid_number"}
		}
		ingredients = append(ingredients, Ingredient{DishID: item.DishID, Portion: item.Portion, FoodValue: value, SourceSnapshot: snapshot})
		total.Proteins += value.Proteins
		total.Fats += value.Fats
		total.Carbs += value.Carbs
		total.Calories += value.Calories
	}

	value := FoodValue{total.Proteins / input.CookedWeight * 100, total.Fats / input.CookedWeight * 100, total.Carbs / input.CookedWeight * 100, total.Calories / input.CookedWeight * 100}
	if !total.valid() || !value.valid() {
		return nil, FoodValue{}, &ValidationError{"cookedWeight", "invalid_number"}
	}

	return ingredients, value, nil
}

func insertIngredients(ctx context.Context, tx pgx.Tx, id int64, ingredients []Ingredient) error {
	for _, i := range ingredients {
		snap := i.SourceSnapshot
		if _, err := tx.Exec(ctx, `INSERT INTO app.ingredients(recipe_id,dish_id,portion,proteins,fats,carbs,calories,source_name,source_icon,source_proteins,source_fats,source_carbs,source_calories) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, id, i.DishID, i.Portion, i.Proteins, i.Fats, i.Carbs, i.Calories, snap.Name, snap.Icon, snap.Proteins, snap.Fats, snap.Carbs, snap.Calories); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) Create(ctx context.Context, user string, input CreateInput) (Dish, error) {
	// Порядок источников не меняет рецепт; нормализация определяет повтор запроса.
	input.Name = strings.TrimSpace(input.Name)
	input.ClientRequestID = strings.ToLower(input.ClientRequestID)
	positions, err := validate(input.RecipeInput)
	if err != nil {
		return Dish{}, err
	}

	sort.Slice(input.Ingredients, func(i, j int) bool { return input.Ingredients[i].DishID < input.Ingredients[j].DishID })
	normalized, err := json.Marshal(input)
	if err != nil {
		return Dish{}, &ValidationError{"ingredients", "invalid_number"}
	}

	var result Dish
	err = s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		// Один ключ сериализуется в БД, включая разные процессы API. Lock снимается с транзакцией.
		if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, user+":create_recipe:"+input.ClientRequestID); err != nil {
			return err
		}

		var previous []byte
		var same bool
		err := tx.QueryRow(ctx, `SELECT request_body=$3::jsonb,response_body FROM app.creation_requests WHERE user_id=$1 AND operation='create_recipe' AND request_id=$2`, user, input.ClientRequestID, normalized).Scan(&same, &previous)
		if err == nil {
			if !same {
				return ErrConflict
			}
			return json.Unmarshal(previous, &result)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}

		ingredients, value, err := prepareIngredients(ctx, tx, input.RecipeInput, positions, nil)
		if err != nil {
			return err
		}

		var id int64
		if err := tx.QueryRow(ctx, `INSERT INTO app.dishes(space_id,name,icon,default_portion,cooked_weight,proteins,fats,carbs,calories) SELECT personal_space_id,$2,$3,$4,$5,$6,$7,$8,$9 FROM app.users WHERE id=$1 RETURNING id`, user, input.Name, input.Icon, input.DefaultPortion, input.CookedWeight, value.Proteins, value.Fats, value.Carbs, value.Calories).Scan(&id); err != nil {
			return err
		}

		if err := insertIngredients(ctx, tx, id, ingredients); err != nil {
			return err
		}

		result, err = read(ctx, tx, id)
		if err != nil {
			return err
		}

		body, err := json.Marshal(result)
		if err != nil {
			return err
		}

		_, err = tx.Exec(ctx, `INSERT INTO app.creation_requests(user_id,operation,request_id,request_body,response_body) VALUES($1,'create_recipe',$2,$3,$4)`, user, input.ClientRequestID, normalized, body)
		return err
	})

	return result, err
}

func editable(ctx context.Context, tx pgx.Tx, id int64) error {
	dish, err := scanSummary(tx.QueryRow(ctx, `SELECT `+summaryColumns+` FROM app.dishes WHERE id=$1 AND deleted_at IS NULL`, id))
	if err != nil {
		return err
	}
	if dish.SpaceID == nil {
		return ErrReadOnly
	}
	if !dish.HasIngredients {
		return &ValidationError{"id", "not_recipe"}
	}

	// Сериализуем PUT/DELETE одного рецепта перед чтением прежних снимков.
	_, err = scanSummary(tx.QueryRow(ctx, `SELECT `+summaryColumns+` FROM app.dishes WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, id))
	return err
}

func (s *Service) Update(ctx context.Context, user string, id int64, input RecipeInput) (Dish, error) {
	input.Name = strings.TrimSpace(input.Name)
	positions, err := validate(input)
	if err != nil {
		return Dish{}, err
	}

	var result Dish
	err = s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		if err := editable(ctx, tx, id); err != nil {
			return err
		}
		previous, err := read(ctx, tx, id)
		if err != nil {
			return err
		}
		ingredients, value, err := prepareIngredients(ctx, tx, input, positions, previous.Ingredients)
		if err != nil {
			return err
		}

		if _, err := tx.Exec(ctx, `DELETE FROM app.ingredients WHERE recipe_id=$1`, id); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE app.dishes SET name=$2,icon=$3,default_portion=$4,cooked_weight=$5,proteins=$6,fats=$7,carbs=$8,calories=$9,updated_at=now() WHERE id=$1`, id, input.Name, input.Icon, input.DefaultPortion, input.CookedWeight, value.Proteins, value.Fats, value.Carbs, value.Calories); err != nil {
			return err
		}
		if err := insertIngredients(ctx, tx, id, ingredients); err != nil {
			return err
		}

		result, err = read(ctx, tx, id)
		return err
	})

	return result, err
}

type Page struct {
	Items    []Summary `json:"items"`
	Page     int64     `json:"page"`
	PageSize int       `json:"pageSize"`
	HasMore  bool      `json:"hasMore"`
}

func (s *Service) List(ctx context.Context, user, scope, query string, page int64) (Page, error) {
	result := Page{Items: make([]Summary, 0), Page: page, PageSize: 25}

	err := s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		// strpos использует строку буквально: wildcard и escape-символы не имеют специального смысла.
		rows, err := tx.Query(ctx, `SELECT `+summaryColumns+` FROM app.dishes WHERE deleted_at IS NULL AND
   (($1='mine' AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
    OR ($1='ingredients' AND cooked_weight IS NULL))
   AND strpos(lower(name),lower($2))>0 ORDER BY name,id LIMIT 26 OFFSET $3`, scope, query, (page-1)*25)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			d, err := scanSummary(rows)
			if err != nil {
				return err
			}
			result.Items = append(result.Items, d)
		}
		if err := rows.Err(); err != nil {
			return err
		}

		if len(result.Items) > 25 {
			result.HasMore = true
			result.Items = result.Items[:25]
		}

		return nil
	})

	return result, err
}

func (s *Service) Delete(ctx context.Context, user string, id int64) error {
	return s.db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
		if err := editable(ctx, tx, id); err != nil {
			return err
		}

		_, err := tx.Exec(ctx, `UPDATE app.dishes SET deleted_at=now(),updated_at=now() WHERE id=$1`, id)
		return err
	})
}
