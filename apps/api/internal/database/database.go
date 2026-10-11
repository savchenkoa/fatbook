package database

import (
	"context"
	"errors"
	"regexp"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUnsafeRole = errors.New("database runtime role is unsafe or not provisioned")
var ErrInvalidUser = errors.New("verified user UUID is required")

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

type Database struct {
	pool    *pgxpool.Pool
	timeout time.Duration
}

// New не требует доступной БД: её отказ отражается readiness, а не рестартом API.
func New(ctx context.Context, databaseURL string, maxConnections int32, queryTimeout time.Duration) (*Database, error) {
	if maxConnections < 1 || maxConnections > 50 || queryTimeout < time.Millisecond || queryTimeout > 10*time.Second {
		return nil, errors.New("invalid database limits")
	}
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, errors.New("invalid DATABASE_URL")
	}
	cfg.MaxConns = maxConnections
	cfg.MinConns = 0
	cfg.MinIdleConns = 0
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	cfg.ConnConfig.ConnectTimeout = queryTimeout
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, errors.New("cannot configure database pool")
	}
	return &Database{pool: pool, timeout: queryTimeout}, nil
}

func (db *Database) Close() { db.pool.Close() }

const safeRoleSQL = `
SELECT EXISTS (
    SELECT 1 FROM pg_roles login JOIN pg_roles runtime ON runtime.rolname = 'fatbook_user'
    WHERE login.rolname = session_user
      AND current_user = session_user
      AND NOT (login.rolsuper OR login.rolbypassrls OR login.rolcreatedb OR login.rolcreaterole OR login.rolreplication OR login.rolinherit)
      AND NOT (runtime.rolsuper OR runtime.rolbypassrls OR runtime.rolcreatedb OR runtime.rolcreaterole OR runtime.rolreplication OR runtime.rolinherit OR runtime.rolcanlogin)
      AND pg_has_role(login.oid, runtime.oid, 'SET')
      AND NOT EXISTS (SELECT 1 FROM pg_auth_members WHERE member = login.oid AND (roleid <> runtime.oid OR admin_option))
      AND NOT EXISTS (SELECT 1 FROM pg_auth_members WHERE member = runtime.oid)
      AND EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app')
      AND NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = current_database() AND datdba IN (login.oid, runtime.oid))
      AND NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspowner IN (login.oid, runtime.oid) AND nspname NOT LIKE 'pg_%')
      AND NOT EXISTS (
          SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relowner IN (login.oid, runtime.oid) AND n.nspname NOT LIKE 'pg_%'
      )
) AND NULLIF(current_setting('app.user_id', true), '') IS NULL`

func (db *Database) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, db.timeout)
	defer cancel()
	var safe bool
	if err := db.pool.QueryRow(ctx, safeRoleSQL).Scan(&safe); err != nil {
		return err
	}
	if !safe {
		return ErrUnsafeRole
	}
	return nil
}

// WithUser принимает UUID только после проверки серверной сессии, не из HTTP DTO.
// Пул закрыт внутри модуля: пользовательские SQL выполняются в этой транзакции.
func (db *Database) WithUser(ctx context.Context, userID string, operation func(context.Context, pgx.Tx) error) error {
	if !uuidPattern.MatchString(userID) || userID == "00000000-0000-0000-0000-000000000000" {
		return ErrInvalidUser
	}
	ctx, cancel := context.WithTimeout(ctx, db.timeout)
	defer cancel()
	tx, err := db.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		// Отмена запроса не откатывает pgx-транзакцию автоматически.
		cleanup, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = tx.Rollback(cleanup)
	}()
	var safe bool
	if err := tx.QueryRow(ctx, safeRoleSQL).Scan(&safe); err != nil {
		return err
	}
	if !safe {
		return ErrUnsafeRole
	}
	if _, err := tx.Exec(ctx, "SET LOCAL ROLE fatbook_user"); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, "SELECT set_config('app.user_id', $1, true), set_config('statement_timeout', $2, true)", userID, strconv.FormatInt(db.timeout.Milliseconds(), 10)); err != nil {
		return err
	}
	if err := operation(ctx, tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
