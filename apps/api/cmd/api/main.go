package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/labstack/echo/v5"

	"github.com/sketchyy/fatbook/apps/api/internal/config"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/httpapi"
	"github.com/sketchyy/fatbook/apps/api/internal/release"
)

func main() { os.Exit(run()) }

func run() int {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("version", release.Version, "commit", release.Commit, "go_version", runtime.Version())
	cfg, err := config.Load()
	if err != nil {
		logger.Error(err.Error(), "error_code", "invalid_configuration")
		return 1
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	db, err := database.New(ctx, cfg.DatabaseURL, cfg.MaxConnections, cfg.QueryTimeout)
	if err != nil {
		logger.Error("cannot configure database", "error_code", "invalid_database_configuration")
		return 1
	}
	defer db.Close()
	e := httpapi.New(db, logger)
	var shutdownErr error
	var server *http.Server
	sc := echo.StartConfig{
		Address:         cfg.Addr,
		HideBanner:      true,
		GracefulTimeout: 10 * time.Second,
		BeforeServeFunc: func(s *http.Server) error {
			server = s
			s.ReadHeaderTimeout = 5 * time.Second
			s.ReadTimeout = 10 * time.Second
			s.WriteTimeout = 20 * time.Second
			s.IdleTimeout = 60 * time.Second
			return nil
		},
		OnShutdownError: func(err error) {
			shutdownErr = err
			_ = server.Close()
		},
	}
	if err := sc.Start(ctx, e); err != nil {
		logger.Error("http server failed", "error_code", "server_failed")
		return 1
	}
	if shutdownErr != nil {
		logger.Error("shutdown timeout", "error_code", "shutdown_failed")
		return 1
	}
	logger.Info("api stopped")
	return 0
}
