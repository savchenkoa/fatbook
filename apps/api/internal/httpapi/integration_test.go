package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
	"github.com/sketchyy/fatbook/apps/api/internal/eatings"
	"github.com/sketchyy/fatbook/apps/api/internal/seed"
	"github.com/sketchyy/fatbook/apps/api/internal/testdb"
)

// Интеграционный тест запускает именно cmd/api: новый процесс должен восстановить сессию,
// подтверждения POST и историю после обрыва соединений с настоящей PostgreSQL.
func TestAPIProcessRestartIsolationAndRecovery(t *testing.T) {
	dsn, admin := testdb.New(t)
	ctx := context.Background()
	for range 2 {
		if err := seed.Prepare(ctx, admin, "  alice secret  ", "bob secret"); err != nil {
			t.Fatal(err)
		}
	}

	var dependencies int
	if err := admin.QueryRow(ctx, `SELECT
		(SELECT count(*) FROM pg_namespace WHERE nspname IN ('storage','vault','cron','realtime')) +
		(SELECT count(*) FROM pg_extension WHERE extname <> 'plpgsql')`).Scan(&dependencies); err != nil {
		t.Fatal(err)
	}
	if dependencies != 0 {
		t.Fatal("scenario depends on nonstandard PostgreSQL schemas/extensions")
	}

	binary := filepath.Join(t.TempDir(), "api")
	build := exec.Command("go", "build", "-race", "-o", binary, "./cmd/api")
	build.Dir = "../.."
	if output, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build API: %v\n%s", err, output)
	}

	var logs logBuffer
	base, stop := startAPIProcess(t, binary, dsn, &logs)
	type requestLog struct {
		RequestID string `json:"request_id"`
		Method    string `json:"method"`
		Route     string `json:"route"`
		Status    int    `json:"status"`
		Code      string `json:"error_code"`
	}
	var expected []requestLog
	request := func(method, path, token, body string, want int) []byte {
		t.Helper()

		status, raw, headers := authRequest(t, base, method, path, token, body)
		if status != want {
			t.Fatalf("%s %s: status=%d, want=%d: %s", method, path, status, want, raw)
		}
		route := strings.Split(path, "?")[0]
		if strings.HasPrefix(route, "/v1/dishes/") || strings.HasPrefix(route, "/v1/eatings/") {
			route = route[:strings.LastIndex(route, "/")] + "/:id"
		}
		code := ""
		if status >= 400 {
			var failure struct{ Error struct{ Code string } }
			if err := json.Unmarshal(raw, &failure); err != nil {
				t.Fatal(err)
			}
			code = failure.Error.Code
		}
		expected = append(expected, requestLog{headers.Get("X-Request-ID"), method, route, status, code})
		for _, secret := range []string{"alice secret", "bob secret", "$argon2id$", "local-auth", "local-api", "fatbook_migrator"} {
			if bytes.Contains(raw, []byte(secret)) {
				t.Fatal("secret leaked to HTTP response")
			}
		}

		return raw
	}
	decode := func(raw []byte, target interface{}) {
		t.Helper()

		if err := json.Unmarshal(raw, target); err != nil {
			t.Fatal(err)
		}
	}
	var alice auth.Session
	decode(request("POST", "/v1/auth/login", "", `{"email":"alice@example.test","password":"  alice secret  "}`, 200), &alice)
	var recipe dishes.Dish
	originalRecipe := request("POST", "/v1/dishes", alice.Token, recipeBody, 201)
	decode(originalRecipe, &recipe)
	path := fmt.Sprintf("/v1/dishes/%d", recipe.ID)
	input := fmt.Sprintf(`{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":%d,"day":"2026-10-18","meal":"lunch","portion":150}`, recipe.ID)
	var first eatings.Eating
	originalEating := request("POST", "/v1/eatings", alice.Token, input, 201)
	decode(originalEating, &first)
	if !closeFoodValue(first.FoodValue, dishes.FoodValue{Proteins: 13.125, Fats: 6, Carbs: 26.25, Calories: 223.125}) {
		t.Fatal("initial portion differs from FAT-123")
	}

	// Управляющее соединение к postgres позволяет отключить только отдельную БД теста.
	controlConfig := admin.Config().Copy()
	controlConfig.Database = "postgres"
	control, err := pgx.ConnectConfig(ctx, controlConfig)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { control.Close(ctx) })
	databaseName := pgx.Identifier{admin.Config().Database}.Sanitize()
	if _, err := control.Exec(ctx, "ALTER DATABASE "+databaseName+" ALLOW_CONNECTIONS false"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if _, err := control.Exec(ctx, "ALTER DATABASE "+databaseName+" ALLOW_CONNECTIONS true"); err != nil {
			t.Error(err)
		}
	})
	if _, err := control.Exec(ctx, `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1`, admin.Config().Database); err != nil {
		t.Fatal(err)
	}
	request("GET", "/v1/eatings?day=2026-10-18", alice.Token, "", 503)
	request("POST", "/v1/auth/login", "", `{"email":"alice@example.test","password":"  alice secret  "}`, 503)
	request("POST", "/v1/auth/logout", alice.Token, "", 503)
	if _, err := control.Exec(ctx, "ALTER DATABASE "+databaseName+" ALLOW_CONNECTIONS true"); err != nil {
		t.Fatal(err)
	}
	// Пул может сначала выдать оставшееся оборванное соединение. Повтор чтения
	// должен восстановиться без нового входа и без подмены 503 пустым дневником.
	deadline := time.Now().Add(10 * time.Second)
	for {
		status, _, _ := authRequest(t, base, "GET", "/v1/auth/me", alice.Token, "")
		if status == 200 {
			break
		}
		if status != 503 || time.Now().After(deadline) {
			t.Fatalf("session did not recover after database outage: %d", status)
		}
		time.Sleep(20 * time.Millisecond)
	}
	request("GET", "/v1/auth/me", alice.Token, "", 200)

	stop()
	base, stop = startAPIProcess(t, binary, dsn, &logs)
	var restored auth.State
	decode(request("GET", "/v1/auth/me", alice.Token, "", 200), &restored)
	if restored.User != alice.User || !restored.ExpiresAt.Equal(alice.ExpiresAt) {
		t.Fatal("restart changed identity or absolute expiry")
	}
	request("PUT", path, alice.Token, recipeUpdate, 200)
	if replay := request("POST", "/v1/dishes", alice.Token, recipeBody, 201); !bytes.Equal(replay, originalRecipe) {
		t.Fatal("restart lost recipe creation receipt")
	}
	if replay := request("POST", "/v1/eatings", alice.Token, input, 201); !bytes.Equal(replay, originalEating) {
		t.Fatal("restart lost original portion receipt/snapshot")
	}
	newInput := strings.ReplaceAll(input, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
	request("POST", "/v1/eatings", alice.Token, newInput, 201)
	var daily eatings.Daily
	decode(request("GET", "/v1/eatings?day=2026-10-18", alice.Token, "", 200), &daily)
	if !closeFoodValue(daily.FoodValue, dishes.FoodValue{Proteins: 34.125, Fats: 15.6, Carbs: 68.25, Calories: 580.125}) || len(daily.Meals["lunch"].Eatings) != 2 {
		t.Fatal("recovered diary differs from FAT-123")
	}
	request("DELETE", path, alice.Token, "", 204)
	request("GET", path, alice.Token, "", 404)
	request("PATCH", fmt.Sprintf("/v1/eatings/%d", first.ID), alice.Token, `{"portion":100}`, 200)
	request("GET", "/v1/auth/me?token=private-query-marker", alice.Token, "", 400)
	request("POST", "/v1/auth/logout", alice.Token, "", 204)
	request("GET", "/v1/eatings?day=2026-10-18", alice.Token, "", 401)

	var bob auth.Session
	decode(request("POST", "/v1/auth/login", "", `{"email":"bob@example.test","password":"bob secret"}`, 200), &bob)
	decode(request("GET", "/v1/eatings?day=2026-10-18", bob.Token, "", 200), &daily)
	if daily.FoodValue != (dishes.FoodValue{}) || len(daily.Meals) != 4 {
		t.Fatal("B inherited A's diary")
	}
	for _, meal := range daily.Meals {
		if len(meal.Eatings) != 0 || meal.FoodValue != (dishes.FoodValue{}) {
			t.Fatal("B's empty day contains A's data")
		}
	}
	request("PATCH", fmt.Sprintf("/v1/eatings/%d", first.ID), bob.Token, `{"portion":100}`, 404)
	var bobRecipe dishes.Dish
	decode(request("POST", "/v1/dishes", bob.Token, recipeBody, 201), &bobRecipe)
	if bobRecipe.ID == recipe.ID || bobRecipe.SpaceID == nil || *bobRecipe.SpaceID != bob.User.PersonalSpaceID {
		t.Fatal("creation key exposed A's recipe to B")
	}
	stop()

	logText := logs.String()
	for _, private := range []string{alice.Token, bob.Token, alice.User.Email, bob.User.Email, "alice secret", "bob secret", "local-api", "local-auth", "$argon2id$", "Рецепт A/B", "Новая версия", "Ингредиент A", "private-query-marker"} {
		if strings.Contains(logText, private) {
			t.Fatal("secret or user content leaked to process logs")
		}
	}
	actual := map[string]requestLog{}
	for _, line := range strings.Split(logText, "\n") {
		var entry requestLog
		if json.Unmarshal([]byte(line), &entry) == nil && entry.RequestID != "" {
			if _, duplicate := actual[entry.RequestID]; duplicate {
				t.Fatal("request ID reused in logs")
			}
			actual[entry.RequestID] = entry
		}
	}
	for _, want := range expected {
		if got := actual[want.RequestID]; got != want {
			t.Fatalf("request log differs from response: got=%+v want=%+v", got, want)
		}
	}
}

func startAPIProcess(t *testing.T, binary, dsn string, logs *logBuffer) (string, func()) {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	listener.Close()

	parsed, err := url.Parse(dsn)
	if err != nil {
		t.Fatal(err)
	}
	parsed.User = url.UserPassword("fatbook_auth", "local-auth")

	command := exec.Command(binary)
	command.Env = append(os.Environ(), "PORT="+fmt.Sprint(port), "DATABASE_URL="+dsn, "AUTH_DATABASE_URL="+parsed.String(),
		"DB_MAX_CONNECTIONS=1", "DB_QUERY_TIMEOUT=3s", "SESSION_LIFETIME=1h", "LOGIN_BURST=20", "LOGIN_INTERVAL=1ms", "LOGIN_CONCURRENCY=1")
	command.Stdout, command.Stderr = logs, logs
	if err := command.Start(); err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() { done <- command.Wait() }()
	stop := sync.OnceFunc(func() {
		_ = command.Process.Signal(os.Interrupt)
		select {
		case err := <-done:
			if err != nil {
				t.Errorf("API process exit: %v", err)
			}
		case <-time.After(15 * time.Second):
			_ = command.Process.Kill()
			<-done
			t.Error("API did not stop gracefully")
		}
	})
	t.Cleanup(stop)

	base := fmt.Sprintf("http://127.0.0.1:%d", port)
	client := &http.Client{Timeout: time.Second}
	deadline := time.Now().Add(15 * time.Second)
	for time.Now().Before(deadline) {
		response, err := client.Get(base + "/health/ready")
		if err == nil {
			response.Body.Close()
			if response.StatusCode == 200 {
				return base, stop
			}
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("API process did not become ready")
	return "", stop
}
