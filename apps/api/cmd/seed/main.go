package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/seed"
	"golang.org/x/term"
)

func main() { os.Exit(run()) }
func run() int {
	cfg, err := pgx.ParseConfig(os.Getenv("LOCAL_SEED_DATABASE_URL"))
	if err != nil || os.Getenv("LOCAL_SEED_DATABASE_URL") == "" || (cfg.Host != "127.0.0.1" && cfg.Host != "localhost" && cfg.Host != "::1") {
		fmt.Fprintln(os.Stderr, "LOCAL_SEED_DATABASE_URL must point to a separate local PostgreSQL")
		return 1
	}
	passwords := make([]string, 2)
	for i, email := range []string{"alice@example.test", "bob@example.test"} {
		fmt.Fprintf(os.Stderr, "Пароль для %s: ", email)
		password, err := term.ReadPassword(int(os.Stdin.Fd()))
		fmt.Fprintln(os.Stderr)
		if err != nil || len(password) == 0 || len(password) > 1024 {
			fmt.Fprintln(os.Stderr, "Нужен пароль длиной 1–1024 байта через локальный терминал")
			return 1
		}
		passwords[i] = string(password)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	conn, err := pgx.ConnectConfig(ctx, cfg)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Не удалось подключиться к локальной БД")
		return 1
	}
	defer conn.Close(ctx)
	if err := seed.Prepare(ctx, conn, passwords[0], passwords[1]); err != nil {
		fmt.Fprintln(os.Stderr, "Не удалось подготовить локальные аккаунты")
		return 1
	}
	fmt.Println("Подготовлены alice@example.test, bob@example.test и четыре простых блюда.")
	return 0
}
