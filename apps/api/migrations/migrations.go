package migrations

import (
	"context"
	"embed"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/pressly/goose/v3/lock"
)

//go:embed *.sql
var files embed.FS

func Run(ctx context.Context, databaseURL, command string) (int64, error) {
	if command != "up" && command != "status" {
		return 0, errors.New("migration command must be up or status")
	}

	cfg, err := pgx.ParseConfig(databaseURL)
	if err != nil {
		return 0, errors.New("invalid migration database configuration")
	}

	db := stdlib.OpenDB(*cfg)
	defer db.Close()
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	locker, err := lock.NewPostgresSessionLocker()
	if err != nil {
		return 0, err
	}

	provider, err := goose.NewProvider(goose.DialectPostgres, db, files, goose.WithSessionLocker(locker))
	if err != nil {
		return 0, err
	}

	if command == "up" {
		if _, err := provider.Up(ctx); err != nil {
			return 0, err
		}
	}

	return provider.GetDBVersion(ctx)
}
