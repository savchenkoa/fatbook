package auth

import (
	"context"
	"errors"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/alexedwards/scs/pgxstore"
	"github.com/alexedwards/scs/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"golang.org/x/time/rate"
)

var (
	ErrCredentials     = errors.New("invalid credentials")
	ErrUnauthenticated = errors.New("unauthenticated")
	ErrLimited         = errors.New("login rate limited")
	ErrUnavailable     = errors.New("auth storage unavailable")
)

type FoodValue struct {
	Proteins float64 `json:"proteins"`
	Fats     float64 `json:"fats"`
	Carbs    float64 `json:"carbs"`
	Calories float64 `json:"calories"`
}

type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	PersonalSpaceID int64     `json:"personalSpaceId"`
	Goals           FoodValue `json:"goals"`
}

type State struct {
	User      User      `json:"user"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type Session struct {
	Token string `json:"token"`
	State
}

type Options struct {
	Lifetime         time.Duration
	Timeout          time.Duration
	MaxConnections   int32
	LoginInterval    time.Duration
	LoginBurst       int
	LoginConcurrency int
}

func DefaultOptions() Options {
	return Options{Lifetime: 30 * 24 * time.Hour, Timeout: 3 * time.Second, MaxConnections: 3, LoginInterval: 6 * time.Second, LoginBurst: 5, LoginConcurrency: 2}
}

type Service struct {
	pool      *pgxpool.Pool
	db        *database.Database
	sessions  *scs.SessionManager
	dummyHash string
	options   Options
	limiter   *rate.Limiter
	checks    chan struct{}
}

func New(ctx context.Context, dsn string, db *database.Database, options Options) (*Service, error) {
	if options.Lifetime <= 0 || options.Timeout <= 0 || options.MaxConnections < 1 || options.LoginInterval <= 0 || options.LoginBurst < 1 || options.LoginConcurrency < 1 {
		return nil, errors.New("invalid auth limits")
	}

	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, errors.New("invalid AUTH_DATABASE_URL")
	}

	cfg.MaxConns = options.MaxConnections
	cfg.ConnConfig.ConnectTimeout = options.Timeout
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, errors.New("cannot configure auth pool")
	}
	dummy, err := HashPassword("unusable dummy password")
	if err != nil {
		pool.Close()
		return nil, err
	}

	manager := scs.New()
	manager.Lifetime = options.Lifetime
	manager.IdleTimeout = 0
	manager.Store = pgxstore.NewWithConfig(pool, pgxstore.Config{TableName: "auth.sessions"})

	return &Service{pool: pool, db: db, sessions: manager, dummyHash: dummy, options: options, limiter: rate.NewLimiter(rate.Every(options.LoginInterval), options.LoginBurst), checks: make(chan struct{}, options.LoginConcurrency)}, nil
}

func (s *Service) Close() { s.pool.Close() }

func (s *Service) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, s.options.Timeout)
	defer cancel()

	var safe bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS (
 SELECT 1 FROM pg_roles r WHERE r.rolname=current_user AND current_user=session_user AND r.rolname='fatbook_auth'
 AND NOT (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolinherit)
 AND NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r.oid)
 AND NOT EXISTS(SELECT 1 FROM pg_database WHERE datname=current_database() AND datdba=r.oid)
 AND NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspowner=r.oid AND nspname NOT LIKE 'pg_%')
 AND NOT EXISTS(SELECT 1 FROM pg_class WHERE relowner=r.oid)
 AND to_regclass('auth.sessions') IS NOT NULL AND to_regclass('auth.passwords') IS NOT NULL
 )`).Scan(&safe)
	if err != nil {
		return errors.Join(ErrUnavailable, err)
	}
	if !safe {
		return errors.Join(ErrUnavailable, database.ErrUnsafeRole)
	}

	return nil
}

func (s *Service) Login(ctx context.Context, email, password, previous string) (Session, error) {
	if !s.limiter.Allow() {
		return Session{}, ErrLimited
	}

	select {
	case s.checks <- struct{}{}:
		defer func() { <-s.checks }()
	default:
		return Session{}, ErrLimited
	}

	ctx, cancel := context.WithTimeout(ctx, s.options.Timeout)
	defer cancel()
	if err := s.Ping(ctx); err != nil {
		return Session{}, errors.Join(ErrUnavailable, err)
	}

	var id, hash string
	err := s.pool.QueryRow(ctx, `SELECT u.id::text,p.hash FROM app.users u JOIN auth.passwords p ON p.user_id=u.id WHERE u.email=$1`, NormalizeEmail(email)).Scan(&id, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		hash = s.dummyHash
	} else if err != nil {
		return Session{}, errors.Join(ErrUnavailable, err)
	}

	valid, err := argon2id.ComparePasswordAndHash(password, hash)
	if err != nil {
		return Session{}, err
	}
	if !valid || id == "" {
		return Session{}, ErrCredentials
	}

	user, err := s.user(ctx, id)
	if err != nil {
		return Session{}, errors.Join(ErrUnavailable, err)
	}

	// Чтение не вызывает Commit. Поэтому logout не может быть отменён обычным запросом.
	if previous != "" {
		old, err := s.sessions.Load(ctx, previous)
		if err != nil {
			return Session{}, errors.Join(ErrUnavailable, err)
		}
		if s.sessions.GetString(old, "userID") == "" {
			return Session{}, ErrUnauthenticated
		}
		if err := s.sessions.Destroy(old); err != nil {
			return Session{}, errors.Join(ErrUnavailable, err)
		}
	}

	fresh, err := s.sessions.Load(ctx, "")
	if err != nil {
		return Session{}, errors.Join(ErrUnavailable, err)
	}
	s.sessions.Put(fresh, "userID", id)
	token, expiry, err := s.sessions.Commit(fresh)
	if err != nil {
		return Session{}, errors.Join(ErrUnavailable, err)
	}

	return Session{Token: token, State: State{User: user, ExpiresAt: expiry}}, nil
}

func (s *Service) Me(ctx context.Context, token string) (State, error) {
	if token == "" {
		return State{}, ErrUnauthenticated
	}

	ctx, cancel := context.WithTimeout(ctx, s.options.Timeout)
	defer cancel()
	if err := s.Ping(ctx); err != nil {
		return State{}, errors.Join(ErrUnavailable, err)
	}
	session, err := s.sessions.Load(ctx, token)
	if err != nil {
		return State{}, errors.Join(ErrUnavailable, err)
	}

	id := s.sessions.GetString(session, "userID")
	if id == "" {
		return State{}, ErrUnauthenticated
	}

	user, err := s.user(ctx, id)
	if err != nil {
		return State{}, errors.Join(ErrUnavailable, err)
	}

	return State{User: user, ExpiresAt: s.sessions.Deadline(session)}, nil
}

func (s *Service) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}

	ctx, cancel := context.WithTimeout(ctx, s.options.Timeout)
	defer cancel()
	if err := s.Ping(ctx); err != nil {
		return errors.Join(ErrUnavailable, err)
	}
	session, err := s.sessions.Load(ctx, token)
	if err != nil {
		return errors.Join(ErrUnavailable, err)
	}
	if err := s.sessions.Destroy(session); err != nil {
		return errors.Join(ErrUnavailable, err)
	}

	return nil
}

func (s *Service) user(ctx context.Context, id string) (User, error) {
	var user User
	err := s.db.WithUser(ctx, id, func(ctx context.Context, tx pgx.Tx) error {
		return tx.QueryRow(ctx, `SELECT u.id::text,u.email,u.personal_space_id,COALESCE(g.proteins,100),COALESCE(g.fats,70),COALESCE(g.carbs,180),COALESCE(g.calories,2000) FROM app.users u LEFT JOIN app.goals g ON g.user_id=u.id`).Scan(&user.ID, &user.Email, &user.PersonalSpaceID, &user.Goals.Proteins, &user.Goals.Fats, &user.Goals.Carbs, &user.Goals.Calories)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUnauthenticated
	}

	return user, err
}

func (s *Service) RetryAfter() int {
	return max(1, int((s.options.LoginInterval+time.Second-1)/time.Second))
}
