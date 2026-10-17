package seed

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/auth"
)

// Prepare работает только с отдельной локальной БД через роль подготовки.
// Фиксированные UUID позволяют повторить подготовку без смены идентичности.
func Prepare(ctx context.Context, conn *pgx.Conn, passwordA, passwordB string) error {
	if passwordA == "" || passwordB == "" {
		return errors.New("both local passwords are required")
	}
	hashes := make([]string, 2)
	for i, password := range []string{passwordA, passwordB} {
		hash, err := auth.HashPassword(password)
		if err != nil {
			return err
		}
		hashes[i] = hash
	}
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())
	for i, id := range []string{"11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"} {
		email := []string{"alice@example.test", "bob@example.test"}[i]
		space := i + 1
		if _, err := tx.Exec(ctx, `INSERT INTO app.users(id,email,personal_space_id) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING`, id, auth.NormalizeEmail(email), space); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `INSERT INTO app.spaces(id,owner_id) VALUES($1,$2) ON CONFLICT(id) DO NOTHING`, space, id); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `INSERT INTO app.memberships(user_id,space_id) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING`, id, space); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `INSERT INTO auth.passwords(user_id,hash) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET hash=EXCLUDED.hash`, id, hashes[i]); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `INSERT INTO app.dishes(id,space_id,name,proteins,fats,carbs,calories) VALUES
 (1,NULL,'Ингредиент A',10,5,20,170), (2,NULL,'Ингредиент B',5,2,10,85),
 (3,1,'Продукт Алисы',12,3,8,110), (4,2,'Продукт Боба',8,4,12,120)
 ON CONFLICT(id) DO NOTHING;
 SELECT setval('app.spaces_id_seq', (SELECT max(id) FROM app.spaces));
 SELECT setval('app.dishes_id_seq', (SELECT max(id) FROM app.dishes));`); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
