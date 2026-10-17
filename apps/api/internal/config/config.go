package config

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/sketchyy/fatbook/apps/api/internal/auth"
)

type Config struct {
	AuthDatabaseURL string
	Auth            auth.Options
	Addr            string
	DatabaseURL     string
	MaxConnections  int32
	QueryTimeout    time.Duration
}

func Load() (Config, error) {
	cfg := Config{AuthDatabaseURL: os.Getenv("AUTH_DATABASE_URL"), Auth: auth.DefaultOptions(), DatabaseURL: os.Getenv("DATABASE_URL"), MaxConnections: 5, QueryTimeout: 3 * time.Second}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.AuthDatabaseURL == "" {
		return Config{}, errors.New("AUTH_DATABASE_URL is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	n, err := strconv.Atoi(port)
	if err != nil || n < 1 || n > 65535 {
		return Config{}, errors.New("PORT must be between 1 and 65535")
	}
	cfg.Addr = ":" + strconv.Itoa(n)

	if raw := os.Getenv("DB_MAX_CONNECTIONS"); raw != "" {
		n, err := strconv.ParseInt(raw, 10, 32)
		if err != nil || n < 1 || n > 50 {
			return Config{}, errors.New("DB_MAX_CONNECTIONS must be between 1 and 50")
		}
		cfg.MaxConnections = int32(n)
	}

	if raw := os.Getenv("DB_QUERY_TIMEOUT"); raw != "" {
		duration, err := time.ParseDuration(raw)
		if err != nil || duration < time.Millisecond || duration > 10*time.Second {
			return Config{}, errors.New("DB_QUERY_TIMEOUT must be between 1ms and 10s")
		}
		cfg.QueryTimeout = duration
	}

	for _, setting := range []struct {
		key      string
		target   *time.Duration
		min, max time.Duration
	}{
		{"SESSION_LIFETIME", &cfg.Auth.Lifetime, time.Millisecond, 30 * 24 * time.Hour},
		{"LOGIN_INTERVAL", &cfg.Auth.LoginInterval, time.Millisecond, time.Hour},
	} {
		if raw := os.Getenv(setting.key); raw != "" {
			value, err := time.ParseDuration(raw)
			if err != nil || value < setting.min || value > setting.max {
				return Config{}, errors.New(setting.key + " is outside allowed limits")
			}
			*setting.target = value
		}
	}

	for _, setting := range []struct {
		key    string
		target *int
		max    int
	}{
		{"LOGIN_BURST", &cfg.Auth.LoginBurst, 100}, {"LOGIN_CONCURRENCY", &cfg.Auth.LoginConcurrency, 8},
	} {
		if raw := os.Getenv(setting.key); raw != "" {
			value, err := strconv.Atoi(raw)
			if err != nil || value < 1 || value > setting.max {
				return Config{}, errors.New(setting.key + " is outside allowed limits")
			}
			*setting.target = value
		}
	}

	cfg.Auth.Timeout = cfg.QueryTimeout

	return cfg, nil
}
