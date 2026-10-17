package database_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
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
