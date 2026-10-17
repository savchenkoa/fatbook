package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sketchyy/fatbook/apps/api/internal/release"
	"github.com/sketchyy/fatbook/apps/api/migrations"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("version", release.Version, "commit", release.Commit)
	if len(os.Args) != 2 || (os.Args[1] != "up" && os.Args[1] != "status") {
		logger.Error("usage: migrate up|status", "error_code", "invalid_command")
		os.Exit(1)
	}
	databaseURL := os.Getenv("MIGRATION_DATABASE_URL")
	if databaseURL == "" {
		logger.Error("MIGRATION_DATABASE_URL is required", "error_code", "invalid_configuration")
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	version, err := migrations.Run(ctx, databaseURL, os.Args[1])
	if err != nil {
		logger.Error("migration failed", "error_code", "migration_failed")
		os.Exit(1)
	}

	logger.Info("migrations complete", "command", os.Args[1], "schema_version", version)
}
