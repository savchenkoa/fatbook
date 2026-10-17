package testdb

import (
	"context"
	"crypto/rand"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/migrations"
)

// New создаёт отдельную БД каждого теста, не изменяя локальную БД разработки.
func New(t *testing.T) (string, *pgx.Conn) {
	t.Helper()
	dsn := os.Getenv("API_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("API_TEST_DATABASE_URL is required for PostgreSQL integration tests")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	admin, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal("cannot connect to test PostgreSQL")
	}
	name := "fatbook_test_" + strings.ToLower(rand.Text())
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+pgx.Identifier{name}.Sanitize()); err != nil {
		admin.Close(ctx)
		t.Fatal(err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		defer admin.Close(ctx)
		if _, err := admin.Exec(ctx, "DROP DATABASE "+pgx.Identifier{name}.Sanitize()+" WITH (FORCE)"); err != nil {
			t.Error(err)
		}
	})
	parsed, err := url.Parse(dsn)
	if err != nil {
		t.Fatal("invalid test PostgreSQL URL")
	}
	parsed.Path = "/" + name
	if _, err := migrations.Run(ctx, parsed.String(), "up"); err != nil {
		t.Fatal(err)
	}
	fixture, err := pgx.Connect(ctx, parsed.String())
	if err != nil {
		t.Fatal("cannot connect to isolated test database")
	}
	t.Cleanup(func() { fixture.Close(context.Background()) })
	parsed.User = url.UserPassword("fatbook_api", "local-api")
	return parsed.String(), fixture
}
