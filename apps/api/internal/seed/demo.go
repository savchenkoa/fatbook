package seed

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type demoPortion struct {
	product string
	grams   float64
}

type demoRecipe struct {
	spaceID     int64
	name, icon  string
	portion     float64
	weight      float64
	ingredients []demoPortion
}

// PrepareDemo дополняет локальные аккаунты после Prepare, не меняя существующие блюда.
// Идентичность демонстрационной записи задаётся именем в каталоге или личном пространстве.
func PrepareDemo(ctx context.Context, conn *pgx.Conn) error {
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	// Проверка наличия и вставка сериализованы, включая параллельные запуски seed.
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended('fatbook:demo-seed:v1',0))`); err != nil {
		return err
	}
	products, err := prepareDemoProducts(ctx, tx)
	if err != nil {
		return err
	}

	recipes := []demoRecipe{
		{1, "Овсянка с бананом", "🥣", 250, 350, []demoPortion{{"Овсяные хлопья", 60}, {"Молоко 2,5%", 200}, {"Банан", 100}}},
		{1, "Курица с рисом", "🍛", 300, 800, []demoPortion{{"Куриная грудка", 300}, {"Рис сухой", 150}, {"Оливковое масло", 10}}},
		{1, "Овощной салат", "🥗", 200, 410, []demoPortion{{"Помидор", 200}, {"Огурец", 200}, {"Оливковое масло", 10}}},
		{2, "Омлет с сыром", "🍳", 200, 250, []demoPortion{{"Яйцо куриное", 150}, {"Молоко 2,5%", 100}, {"Сыр", 30}}},
		{2, "Гречка с курицей", "🍲", 300, 750, []demoPortion{{"Гречка сухая", 150}, {"Куриная грудка", 300}, {"Оливковое масло", 10}}},
		{2, "Творог с бананом", "🍌", 250, 300, []demoPortion{{"Творог 5%", 200}, {"Банан", 100}}},
	}
	for _, recipe := range recipes {
		if err := prepareDemoRecipe(ctx, tx, products, recipe); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func prepareDemoProducts(ctx context.Context, tx pgx.Tx) (map[string]int64, error) {
	// Приблизительные значения на 100 г нужны для демонстрации интерфейса.
	products := []struct {
		name, icon                      string
		proteins, fats, carbs, calories float64
	}{
		{"Овсяные хлопья", "🌾", 13, 7, 60, 370},
		{"Молоко 2,5%", "🥛", 3, 2.5, 4.8, 52},
		{"Банан", "🍌", 1.1, 0.3, 23, 89},
		{"Куриная грудка", "🍗", 23, 2, 0, 110},
		{"Рис сухой", "🍚", 7, 1, 78, 350},
		{"Помидор", "🍅", 1, 0.2, 4, 20},
		{"Огурец", "🥒", 0.8, 0.1, 3, 15},
		{"Оливковое масло", "🫒", 0, 100, 0, 900},
		{"Яйцо куриное", "🥚", 13, 11, 1, 155},
		{"Сыр", "🧀", 25, 27, 0, 350},
		{"Гречка сухая", "🌾", 13, 3.5, 62, 340},
		{"Творог 5%", "🥛", 17, 5, 3, 125},
	}
	ids := make(map[string]int64, len(products))
	for _, product := range products {
		var id int64
		err := tx.QueryRow(ctx, `INSERT INTO app.dishes(name,icon,proteins,fats,carbs,calories)
 SELECT $1,$2,$3,$4,$5,$6 WHERE NOT EXISTS (
   SELECT 1 FROM app.dishes WHERE space_id IS NULL AND name=$1 AND cooked_weight IS NULL AND deleted_at IS NULL
 ) RETURNING id`, product.name, product.icon, product.proteins, product.fats, product.carbs, product.calories).Scan(&id)
		if errors.Is(err, pgx.ErrNoRows) {
			err = tx.QueryRow(ctx, `SELECT id FROM app.dishes
 WHERE space_id IS NULL AND name=$1 AND cooked_weight IS NULL AND deleted_at IS NULL ORDER BY id LIMIT 1`, product.name).Scan(&id)
		}
		if err != nil {
			return nil, err
		}
		ids[product.name] = id
	}

	return ids, nil
}

func prepareDemoRecipe(ctx context.Context, tx pgx.Tx, products map[string]int64, recipe demoRecipe) error {
	var id int64
	err := tx.QueryRow(ctx, `INSERT INTO app.dishes(space_id,name,icon,default_portion,cooked_weight,proteins,fats,carbs,calories)
 SELECT $1,$2,$3,$4,$5,0,0,0,0 WHERE NOT EXISTS (
   SELECT 1 FROM app.dishes WHERE space_id=$1 AND name=$2
 ) RETURNING id`, recipe.spaceID, recipe.name, recipe.icon, recipe.portion, recipe.weight).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}

	for _, ingredient := range recipe.ingredients {
		if _, err := tx.Exec(ctx, `INSERT INTO app.ingredients(
 recipe_id,dish_id,portion,source_name,source_icon,source_proteins,source_fats,source_carbs,source_calories,
 proteins,fats,carbs,calories)
 SELECT $1,id,$3::double precision,name,icon,proteins,fats,carbs,calories,
 proteins*($3::double precision/100),fats*($3::double precision/100),carbs*($3::double precision/100),calories*($3::double precision/100)
 FROM app.dishes WHERE id=$2`, id, products[ingredient.product], ingredient.grams); err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx, `UPDATE app.dishes SET (proteins,fats,carbs,calories) = (
 SELECT sum(proteins)/$2*100,sum(fats)/$2*100,sum(carbs)/$2*100,sum(calories)/$2*100
 FROM app.ingredients WHERE recipe_id=$1
 ) WHERE id=$1`, id, recipe.weight)
	return err
}
