package config_test

import (
	"strings"
	"testing"
	"time"

	"github.com/sketchyy/fatbook/apps/api/internal/config"
)

func defaults(t *testing.T) {
	t.Helper()
	t.Setenv("DATABASE_URL", "postgres://api:secret-value@localhost/fatbook")
	t.Setenv("AUTH_DATABASE_URL", "postgres://auth:secret-value@localhost/fatbook")
	for _, key := range []string{"SESSION_LIFETIME", "LOGIN_INTERVAL", "LOGIN_BURST", "LOGIN_CONCURRENCY"} {
		t.Setenv(key, "")
	}
	t.Setenv("PORT", "")
	t.Setenv("DB_MAX_CONNECTIONS", "")
	t.Setenv("DB_QUERY_TIMEOUT", "")
}

func TestLoadDefaults(t *testing.T) {
	defaults(t)
	cfg, err := config.Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Addr != ":8080" || cfg.MaxConnections != 5 || cfg.QueryTimeout != 3*time.Second {
		t.Fatal("unexpected default HTTP address or database limits")
	}
	if cfg.DatabaseURL != "postgres://api:secret-value@localhost/fatbook" {
		t.Fatal("database URL was not preserved")
	}
}

func TestLoadOverrides(t *testing.T) {
	defaults(t)
	t.Setenv("PORT", "9080")
	t.Setenv("DB_MAX_CONNECTIONS", "2")
	t.Setenv("DB_QUERY_TIMEOUT", "750ms")
	cfg, err := config.Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Addr != ":9080" || cfg.MaxConnections != 2 || cfg.QueryTimeout != 750*time.Millisecond {
		t.Fatal("configuration overrides were not applied")
	}
}

func TestLoadRejectsInvalidLimitsWithoutLeakingValues(t *testing.T) {
	for _, test := range []struct{ key, value string }{
		{"DATABASE_URL", ""}, {"AUTH_DATABASE_URL", ""}, {"SESSION_LIFETIME", "0s"}, {"SESSION_LIFETIME", "721h"}, {"LOGIN_INTERVAL", "secret-value"}, {"LOGIN_BURST", "0"}, {"LOGIN_CONCURRENCY", "9"},
		{"PORT", "0"}, {"PORT", "65536"}, {"PORT", "secret-value"},
		{"DB_MAX_CONNECTIONS", "0"}, {"DB_MAX_CONNECTIONS", "51"}, {"DB_MAX_CONNECTIONS", "secret-value"},
		{"DB_QUERY_TIMEOUT", "0s"}, {"DB_QUERY_TIMEOUT", "11s"}, {"DB_QUERY_TIMEOUT", "1us"}, {"DB_QUERY_TIMEOUT", "secret-value"},
	} {
		t.Run(test.key+"/"+test.value, func(t *testing.T) {
			defaults(t)
			t.Setenv(test.key, test.value)
			_, err := config.Load()
			if err == nil {
				t.Fatal("invalid configuration was accepted")
			}
			if strings.Contains(err.Error(), "secret-value") {
				t.Fatal("input value leaked to configuration error")
			}
		})
	}
}
