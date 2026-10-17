package database_test

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/seed"
	"github.com/sketchyy/fatbook/apps/api/internal/testdb"
	"testing"
	"time"
)

func TestRecipeRLSProtectsCompositionAndReceipts(t *testing.T) {
	dsn, admin := testdb.New(t)
	ctx := context.Background()
	if err := seed.Prepare(ctx, admin, "alice secret", "bob secret"); err != nil {
		t.Fatal(err)
	}
	if _, err := admin.Exec(ctx, `INSERT INTO app.dishes(id,space_id,name,cooked_weight,proteins,fats,carbs,calories) VALUES
 (10,1,'Alice recipe',400,1,2,3,4),(11,2,'Bob recipe',400,1,2,3,4);
 INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES
 (10,3,100,'Alice source',12,3,8,110,12,3,8,110),(11,4,100,'Bob source',8,4,12,120,8,4,12,120);
 INSERT INTO app.creation_requests VALUES ('11111111-1111-4111-8111-111111111111','create_recipe','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{}','{}');`); err != nil {
		t.Fatal(err)
	}
	db, err := database.New(ctx, dsn, 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	for _, user := range []string{userA, userB, userA} {
		if err := db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
			var dishes, ingredients, receipts int
			if err := tx.QueryRow(ctx, `SELECT (SELECT count(*) FROM app.dishes),(SELECT count(*) FROM app.ingredients),(SELECT count(*) FROM app.creation_requests)`).Scan(&dishes, &ingredients, &receipts); err != nil {
				return err
			}
			wantReceipts := 0
			if user == userA {
				wantReceipts = 1
			}
			if dishes != 4 || ingredients != 1 || receipts != wantReceipts {
				t.Fatalf("RLS %s: dishes=%d ingredients=%d receipts=%d", user, dishes, ingredients, receipts)
			}
			return nil
		}); err != nil {
			t.Fatal(err)
		}
	}
	for _, statement := range []string{
		`INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES(10,4,100,'forbidden',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES(11,1,100,'forbidden',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.ingredients(recipe_id,dish_id,portion,source_name,source_proteins,source_fats,source_carbs,source_calories,proteins,fats,carbs,calories) VALUES(10,11,100,'nested',1,1,1,1,1,1,1,1)`,
		`UPDATE app.ingredients SET dish_id=4 WHERE recipe_id=10`,
		`UPDATE app.ingredients SET recipe_id=11 WHERE recipe_id=10`,
		`INSERT INTO app.creation_requests VALUES('22222222-2222-4222-8222-222222222222','create_recipe','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{}','{}')`,
		`INSERT INTO app.dishes(space_id,name,proteins,fats,carbs,calories) VALUES(NULL,'catalog injection',1,1,1,1)`,
	} {
		err := db.WithUser(ctx, userA, func(ctx context.Context, tx pgx.Tx) error { _, err := tx.Exec(ctx, statement); return err })
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != "42501" {
			t.Fatalf("WITH CHECK: %v (%s)", err, statement)
		}
		if err := db.Ping(ctx); err != nil {
			t.Fatal(err)
		}
	}
	// Неполные/нечисловые КБЖУ не могут стать источником даже через прямой SQL.
	for _, value := range []string{"NULL", "'NaN'::float8", "'Infinity'::float8", "'-Infinity'::float8", "-1"} {
		if _, err := admin.Exec(ctx, `UPDATE app.dishes SET proteins=`+value+` WHERE id=1`); err == nil {
			t.Fatalf("invalid FoodValue accepted: %s", value)
		}
	}
}
