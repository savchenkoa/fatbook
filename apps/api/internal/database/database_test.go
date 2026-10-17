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

const userA = "11111111-1111-4111-8111-111111111111"
const userB = "22222222-2222-4222-8222-222222222222"

func TestUserTransactionEnforcesRLS(t *testing.T) {
	dsn, fixture := testdb.New(t)
	_, err := fixture.Exec(context.Background(), `
		CREATE TABLE app.access_probe (owner_id uuid NOT NULL, value text NOT NULL);
		ALTER TABLE app.access_probe ENABLE ROW LEVEL SECURITY;
		ALTER TABLE app.access_probe FORCE ROW LEVEL SECURITY;
		CREATE POLICY owner_only ON app.access_probe
			USING (owner_id = app.current_user_id())
			WITH CHECK (owner_id = app.current_user_id());
		GRANT SELECT, INSERT ON app.access_probe TO fatbook_user;
		INSERT INTO app.access_probe VALUES
			('11111111-1111-4111-8111-111111111111', 'A'),
			('22222222-2222-4222-8222-222222222222', 'B');
	`)
	if err != nil {
		t.Fatal(err)
	}

	db, err := database.New(context.Background(), dsn, 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)

	err = db.WithUser(context.Background(), userA, func(ctx context.Context, tx pgx.Tx) error {
		rows, err := tx.Query(ctx, "SELECT value FROM app.access_probe")
		if err != nil {
			return err
		}
		values, err := pgx.CollectRows(rows, pgx.RowTo[string])
		if err != nil {
			return err
		}

		if len(values) != 1 || values[0] != "A" {
			t.Fatalf("visible values = %v, want [A]", values)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Ping(context.Background()); err != nil {
		t.Fatal(err)
	}

	t.Run("foreign reference is rejected by PostgreSQL", func(t *testing.T) {
		err := db.WithUser(context.Background(), userB, func(ctx context.Context, tx pgx.Tx) error {
			_, err := tx.Exec(ctx, "INSERT INTO app.access_probe VALUES ($1, 'forbidden')", userA)
			return err
		})

		var pgError *pgconn.PgError
		if !errors.As(err, &pgError) || pgError.Code != "42501" {
			t.Fatalf("expected RLS rejection, got %v", err)
		}
		if err := db.Ping(context.Background()); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("rollback removes writes and identity", func(t *testing.T) {
		failure := errors.New("operation failed")

		err := db.WithUser(context.Background(), userA, func(ctx context.Context, tx pgx.Tx) error {
			if _, err := tx.Exec(ctx, "INSERT INTO app.access_probe VALUES ($1, 'rolled back')", userA); err != nil {
				return err
			}
			return failure
		})

		if !errors.Is(err, failure) {
			t.Fatalf("expected operation failure, got %v", err)
		}
		if err := db.Ping(context.Background()); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("next user has only their identity", func(t *testing.T) {
		for _, user := range []string{userB, userA, userB} {
			err := db.WithUser(context.Background(), user, func(ctx context.Context, tx pgx.Tx) error {
				var identity, role string
				var count int
				if err := tx.QueryRow(ctx, "SELECT app.current_user_id()::text, current_user, (SELECT count(*) FROM app.access_probe)").Scan(&identity, &role, &count); err != nil {
					return err
				}
				if identity != user || role != "fatbook_user" || count != 1 {
					t.Fatalf("identity=%s role=%s count=%d", identity, role, count)
				}
				return nil
			})
			if err != nil {
				t.Fatal(err)
			}
			if err := db.Ping(context.Background()); err != nil {
				t.Fatal(err)
			}
		}
	})

	t.Run("invalid identity never enters operation", func(t *testing.T) {
		for _, user := range []string{"", "client-user", "00000000-0000-0000-0000-000000000000", userA + "'; RESET ROLE;"} {
			err := db.WithUser(context.Background(), user, func(context.Context, pgx.Tx) error { t.Fatal("operation ran without valid identity"); return nil })
			if !errors.Is(err, database.ErrInvalidUser) {
				t.Fatalf("expected invalid user, got %v", err)
			}
		}
	})
}

func TestPrivilegedConnectionCannotRunUserOperation(t *testing.T) {
	_, admin := testdb.New(t)
	db, err := database.New(context.Background(), admin.Config().ConnString(), 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	if err := db.Ping(context.Background()); !errors.Is(err, database.ErrUnsafeRole) {
		t.Fatalf("expected unsafe role, got %v", err)
	}
	err = db.WithUser(context.Background(), userA, func(context.Context, pgx.Tx) error { t.Fatal("operation ran under migration role"); return nil })
	if !errors.Is(err, database.ErrUnsafeRole) {
		t.Fatalf("expected unsafe role, got %v", err)
	}
}

func TestTimeoutReleasesSingleConnection(t *testing.T) {
	dsn, _ := testdb.New(t)
	db, err := database.New(context.Background(), dsn, 1, 250*time.Millisecond)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	err = db.WithUser(context.Background(), userA, func(ctx context.Context, tx pgx.Tx) error {
		_, err := tx.Exec(ctx, "SELECT pg_sleep(5)")
		return err
	})
	if err == nil {
		t.Fatal("slow query succeeded instead of timing out")
	}
	if err := db.Ping(context.Background()); err != nil {
		t.Fatal(err)
	}
	err = db.WithUser(context.Background(), userB, func(ctx context.Context, tx pgx.Tx) error {
		var identity string
		if err := tx.QueryRow(ctx, "SELECT app.current_user_id()::text").Scan(&identity); err != nil {
			return err
		}
		if identity != userB {
			t.Fatalf("stale identity = %s", identity)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestPersonalDataRLSAndAuthTablesArePrivate(t *testing.T) {
	dsn, admin := testdb.New(t)
	if err := seed.Prepare(context.Background(), admin, "alice secret", "bob secret"); err != nil {
		t.Fatal(err)
	}
	db, err := database.New(context.Background(), dsn, 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	for _, id := range []string{userA, userB, userA} {
		err := db.WithUser(context.Background(), id, func(ctx context.Context, tx pgx.Tx) error {
			var users, spaces, members, visibleDishes int
			var email string
			if err := tx.QueryRow(ctx, `SELECT (SELECT count(*) FROM app.users),(SELECT count(*) FROM app.spaces),(SELECT count(*) FROM app.memberships),(SELECT count(*) FROM app.dishes),(SELECT email FROM app.users)`).Scan(&users, &spaces, &members, &visibleDishes, &email); err != nil {
				return err
			}

			if users != 1 || spaces != 1 || members != 1 || visibleDishes != 3 {
				t.Fatalf("visible rows: users=%d spaces=%d members=%d dishes=%d", users, spaces, members, visibleDishes)
			}

			expected := "alice@example.test"
			if id == userB {
				expected = "bob@example.test"
			}
			if email != expected {
				t.Fatal("foreign identity leaked")
			}

			var unsafe bool
			if err := tx.QueryRow(ctx, `SELECT rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole FROM pg_roles WHERE rolname=current_user`).Scan(&unsafe); err != nil {
				return err
			}
			if unsafe {
				t.Fatal("unsafe user role")
			}
			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
		if err := db.Ping(context.Background()); err != nil {
			t.Fatal(err)
		}
	}
	for _, sql := range []string{
		`SELECT * FROM auth.passwords`, `SELECT * FROM auth.sessions`,
		`INSERT INTO app.memberships(user_id,space_id) VALUES ('11111111-1111-4111-8111-111111111111',2)`,
		`UPDATE app.spaces SET owner_id='22222222-2222-4222-8222-222222222222'`,
		`INSERT INTO app.dishes(space_id,name,proteins,fats,carbs,calories) VALUES (2,'foreign',1,1,1,1)`,
		`INSERT INTO app.dishes(space_id,name,proteins,fats,carbs,calories) VALUES (NULL,'catalog',1,1,1,1)`,
		`UPDATE app.dishes SET space_id=2 WHERE id=3`,
	} {
		err := db.WithUser(context.Background(), userA, func(ctx context.Context, tx pgx.Tx) error { _, err := tx.Exec(ctx, sql); return err })
		var pgError *pgconn.PgError
		if !errors.As(err, &pgError) || pgError.Code != "42501" {
			t.Fatalf("SQL should be forbidden: %s: %v", sql, err)
		}
		if err := db.Ping(context.Background()); err != nil {
			t.Fatal(err)
		}
	}
	err = db.WithUser(context.Background(), userA, func(ctx context.Context, tx pgx.Tx) error {
		result, err := tx.Exec(ctx, `UPDATE app.dishes SET name='forbidden' WHERE id IN (1,2,4)`)
		if err != nil {
			return err
		}
		if result.RowsAffected() != 0 {
			t.Fatal("catalog/foreign dish changed")
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
