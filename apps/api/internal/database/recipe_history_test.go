package database_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/seed"
	"github.com/sketchyy/fatbook/apps/api/internal/testdb"
)

func TestRecipeHistoryRLSRejectsDeletedAndForeignReferences(t *testing.T) {
	dsn, admin := testdb.New(t)
	ctx := context.Background()
	if err := seed.Prepare(ctx, admin, "alice secret", "bob secret"); err != nil {
		t.Fatal(err)
	}
	if _, err := admin.Exec(ctx, `INSERT INTO app.dishes(id,space_id,name,cooked_weight,proteins,fats,carbs,calories) VALUES
        (10,1,'Alice recipe',400,1,2,3,4),(11,2,'Bob recipe',400,1,2,3,4);
        INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES
        (10,1,100,'A',10,5,20,170,10,5,20,170);`); err != nil {
		t.Fatal(err)
	}
	db, err := database.New(ctx, dsn, 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	if err := db.WithUser(ctx, userA, func(ctx context.Context, tx pgx.Tx) error {
		for _, query := range []string{
			`UPDATE app.dishes SET name='forbidden' WHERE id IN (1,2,4,11)`,
			`UPDATE app.dishes SET deleted_at=now() WHERE id IN (1,2,4,11)`,
			`UPDATE app.ingredients SET portion=200 WHERE recipe_id=11`,
			`DELETE FROM app.ingredients WHERE recipe_id=11`,
		} {
			result, err := tx.Exec(ctx, query)
			if err != nil {
				return err
			}
			if result.RowsAffected() != 0 {
				t.Fatalf("foreign/catalog mutation: %s", query)
			}
		}
		_, err := tx.Exec(ctx, `UPDATE app.dishes SET deleted_at=now() WHERE id=10`)
		return err
	}); err != nil {
		t.Fatal(err)
	}
	if _, err := admin.Exec(ctx, `UPDATE app.dishes SET deleted_at=now() WHERE id=3`); err != nil {
		t.Fatal(err)
	}

	for _, query := range []string{
		`INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES('11111111-1111-4111-8111-111111111111',10,'2026-10-18','lunch',100,'deleted',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES('11111111-1111-4111-8111-111111111111',3,'2026-10-18','lunch',100,'deleted simple',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES(10,2,100,'deleted parent',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES(11,1,100,'foreign parent',1,1,1,1,1,1,1,1)`,
		`DELETE FROM app.dishes WHERE id=10`,
	} {
		err := db.WithUser(ctx, userA, func(ctx context.Context, tx pgx.Tx) error { _, err := tx.Exec(ctx, query); return err })
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != "42501" {
			t.Fatalf("RLS accepted %s: %v", query, err)
		}
		if err := db.Ping(ctx); err != nil {
			t.Fatal(err)
		}
	}
	// Проверяем источник отдельно на активном рецепте, без маскировки политикой родителя.
	if _, err := admin.Exec(ctx, `UPDATE app.dishes SET deleted_at=NULL WHERE id=10`); err != nil {
		t.Fatal(err)
	}
	for _, query := range []string{
		`INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES(10,3,100,'deleted source',1,1,1,1,1,1,1,1)`,
		`UPDATE app.ingredients SET dish_id=3 WHERE recipe_id=10`,
		`UPDATE app.ingredients SET dish_id=4 WHERE recipe_id=10`,
		`UPDATE app.ingredients SET recipe_id=11 WHERE recipe_id=10`,
	} {
		err := db.WithUser(ctx, userA, func(ctx context.Context, tx pgx.Tx) error { _, err := tx.Exec(ctx, query); return err })
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != "42501" {
			t.Fatalf("WITH CHECK accepted %s: %v", query, err)
		}
		if err := db.Ping(ctx); err != nil {
			t.Fatal(err)
		}
	}
}
