package config

import (
	"errors"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Addr           string
	DatabaseURL    string
	MaxConnections int32
	QueryTimeout   time.Duration
}

func Load() (Config, error) {
	cfg := Config{DatabaseURL: os.Getenv("DATABASE_URL"), MaxConnections: 5, QueryTimeout: 3 * time.Second}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
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
	return cfg, nil
}
