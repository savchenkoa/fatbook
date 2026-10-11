package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/sketchyy/fatbook/apps/api/internal/config"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/httpapi"
	"github.com/sketchyy/fatbook/apps/api/internal/release"
)

func main() { os.Exit(run()) }

func run() int {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("version", release.Version, "commit", release.Commit)
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
	server := httpapi.New(cfg.Addr, db, logger)
	listener, err := net.Listen("tcp", cfg.Addr)
	if err != nil {
		logger.Error("cannot listen", "error_code", "listen_failed")
		return 1
	}
	errorsChannel := make(chan error, 1)
	go func() { errorsChannel <- server.Serve(listener) }()
	logger.Info("api started", "address", cfg.Addr, "go_version", runtime.Version())
	select {
	case err := <-errorsChannel:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("http server failed", "error_code", "server_failed")
			return 1
		}
	case <-ctx.Done():
		stop()
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdown); err != nil {
			_ = server.Close()
			logger.Error("shutdown timeout", "error_code", "shutdown_failed")
			return 1
		}
	}
	logger.Info("api stopped")
	return 0
}
