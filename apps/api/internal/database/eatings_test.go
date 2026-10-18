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

func TestEatingRLSProtectsPersonalDiaryAndSources(t *testing.T) {
	dsn, admin := testdb.New(t)
	ctx := context.Background()
	if err := seed.Prepare(ctx, admin, "alice secret", "bob secret"); err != nil {
		t.Fatal(err)
	}
	if _, err := admin.Exec(ctx, `INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES
 ('11111111-1111-4111-8111-111111111111',3,'2026-10-18','lunch',100,'Alice snapshot',12,3,8,110,12,3,8,110),
 ('22222222-2222-4222-8222-222222222222',4,'2026-10-18','lunch',100,'Bob snapshot',8,4,12,120,8,4,12,120);`); err != nil {
		t.Fatal(err)
	}
	db, err := database.New(ctx, dsn, 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	for _, user := range []string{userA, userB, userA} {
		if err := db.WithUser(ctx, user, func(ctx context.Context, tx pgx.Tx) error {
			var count int
			var owner string
			if err := tx.QueryRow(ctx, `SELECT count(*),min(user_id::text) FROM app.eatings`).Scan(&count, &owner); err != nil {
				return err
			}
			if count != 1 || owner != user {
				t.Fatalf("diary leaked: count=%d user=%s", count, owner)
			}
			for _, statement := range []string{`UPDATE app.eatings SET portion=200 WHERE user_id<>app.current_user_id()`, `DELETE FROM app.eatings WHERE user_id<>app.current_user_id()`} {
				result, err := tx.Exec(ctx, statement)
				if err != nil {
					return err
				}
				if result.RowsAffected() != 0 {
					t.Fatal("foreign diary changed")
				}
			}

			return nil
		}); err != nil {
			t.Fatal(err)
		}
		if err := db.Ping(ctx); err != nil {
			t.Fatal(err)
		}
	}

	for _, statement := range []string{
		`INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES('11111111-1111-4111-8111-111111111111',4,'2026-10-18','lunch',100,'foreign source',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES('22222222-2222-4222-8222-222222222222',1,'2026-10-18','lunch',100,'foreign owner',1,1,1,1,1,1,1,1)`,
		`INSERT INTO app.eatings(user_id,dish_id,day,meal,portion,dish_name,dish_proteins,dish_fats,dish_carbs,dish_calories,proteins,fats,carbs,calories) VALUES('11111111-1111-4111-8111-111111111111',NULL,'2026-10-18','lunch',100,'no source',1,1,1,1,1,1,1,1)`,
		`UPDATE app.eatings SET user_id='22222222-2222-4222-8222-222222222222'`,
		`UPDATE app.eatings SET dish_id=4`,
		`UPDATE app.eatings SET dish_name='forged',dish_proteins=999`,
		`UPDATE app.eatings SET day='2026-10-19'`,
	} {
		err := db.WithUser(ctx, userA, func(ctx context.Context, tx pgx.Tx) error { _, err := tx.Exec(ctx, statement); return err })
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != "42501" {
			t.Fatalf("RLS/WITH CHECK accepted %s: %v", statement, err)
		}
		if err := db.Ping(ctx); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := admin.Exec(ctx, `UPDATE app.dishes SET deleted_at=now() WHERE id=3`); err != nil {
		t.Fatal(err)
	}
	if err := db.WithUser(ctx, userA, func(ctx context.Context, tx pgx.Tx) error {
		var name string
		if err := tx.QueryRow(ctx, `UPDATE app.eatings SET portion=150 WHERE id=1 RETURNING dish_name`).Scan(&name); err != nil {
			return err
		}
		if name != "Alice snapshot" {
			t.Fatal("lost historical snapshot")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if err := db.Ping(ctx); err != nil {
		t.Fatal(err)
	}
}
