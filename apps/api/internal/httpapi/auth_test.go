package httpapi_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/santhosh-tekuri/jsonschema/v6"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
	"github.com/sketchyy/fatbook/apps/api/internal/httpapi"
	"github.com/sketchyy/fatbook/apps/api/internal/seed"
	"github.com/sketchyy/fatbook/apps/api/internal/testdb"
)

func authServer(t *testing.T, options auth.Options) (*httptest.Server, string) {
	dsn, admin := testdb.New(t)
	if err := seed.Prepare(context.Background(), admin, "  alice secret  ", "bob secret"); err != nil {
		t.Fatal(err)
	}
	if _, err := admin.Exec(context.Background(), `INSERT INTO app.goals(user_id,proteins,fats,carbs,calories) VALUES ('22222222-2222-4222-8222-222222222222',80,60,150,1700)`); err != nil {
		t.Fatal(err)
	}

	db, err := database.New(context.Background(), dsn, 3, 3*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)

	parsed, _ := url.Parse(dsn)
	parsed.User = url.UserPassword("fatbook_auth", "local-auth")

	sessions, err := auth.New(context.Background(), parsed.String(), db, options)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(sessions.Close)

	e := httpapi.New(db, slog.New(slog.NewJSONHandler(io.Discard, nil)))
	httpapi.RegisterAuth(e, sessions)
	httpapi.RegisterDishes(e, sessions, dishes.New(db))
	server := httptest.NewServer(e)
	t.Cleanup(server.Close)

	return server, parsed.String()
}

func TestLoginRestoresUserWithAbsoluteExpiry(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())

	status, body, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", "", `{"email":"  ALICE@EXAMPLE.TEST  ","password":"  alice secret  "}`)
	if status != 200 {
		t.Fatalf("login %d: %s", status, body)
	}

	var session auth.Session
	if err := json.Unmarshal(body, &session); err != nil {
		t.Fatal(err)
	}
	if session.Token == "" || session.User.Email != "alice@example.test" || session.User.PersonalSpaceID <= 0 || session.User.Goals.Calories != 2000 {
		t.Fatalf("session = %+v", session.User)
	}
	if time.Until(session.ExpiresAt) < 29*24*time.Hour {
		t.Fatal("expected 30-day expiry")
	}

	status, body, _ = authRequest(t, server.URL, "GET", "/v1/auth/me", session.Token, "")

	var state auth.State
	if err := json.Unmarshal(body, &state); err != nil {
		t.Fatal(err)
	}
	if status != 200 || state.User.ID != session.User.ID || !state.ExpiresAt.Equal(session.ExpiresAt) {
		t.Fatalf("me %d: %s", status, body)
	}
	if strings.Contains(string(body), session.Token) {
		t.Fatal("me exposes token")
	}
}

func authRequest(t *testing.T, base, method, path, token, body string) (int, []byte, http.Header) {
	t.Helper()

	req, err := http.NewRequest(method, base+path, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	data, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if res.Header.Get("X-Request-ID") == "" || res.Header.Get("Cache-Control") != "no-store" {
		t.Fatal("missing requestId/no-store")
	}
	validateAuthContract(t, method, path, res, data)

	return res.StatusCode, data, res.Header
}

func TestInvalidCredentialsAndBearerDoNotCreateSessions(t *testing.T) {
	options := auth.DefaultOptions()
	options.LoginBurst = 20
	server, _ := authServer(t, options)

	for _, body := range []string{`{"email":"alice@example.test","password":"alice secret"}`, `{"email":"missing@example.test","password":"  alice secret  "}`} {
		status, data, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", "", body)
		if status != 401 || !strings.Contains(string(data), `"code":"invalid_credentials"`) {
			t.Fatalf("login %d: %s", status, data)
		}
	}

	for _, token := range []string{"", "forged", "eyJhbGciOiJIUzI1NiJ9.fake.jwt"} {
		status, data, _ := authRequest(t, server.URL, "GET", "/v1/auth/me", token, "")
		if status != 401 || !strings.Contains(string(data), `"code":"unauthenticated"`) {
			t.Fatalf("me %d: %s", status, data)
		}
	}

	for _, path := range []string{"/v1/auth/me?userId=11111111-1111-4111-8111-111111111111", "/v1/auth/me?token=forged"} {
		status, _, _ := authRequest(t, server.URL, "GET", path, "", "")
		if status != 400 {
			t.Fatalf("query status %d", status)
		}
	}

	for _, body := range []string{`{"email":"a","password":"b","userId":"owner"}`, `{"email":null,"password":"b"}`, `{"email":17,"password":"b"}`, `{"password":"b"}`} {
		status, _, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", "", body)
		if status != 400 {
			t.Fatalf("invalid DTO status %d", status)
		}
	}
}

func login(t *testing.T, server *httptest.Server, previous, email, password string) auth.Session {
	t.Helper()

	body, _ := json.Marshal(map[string]string{"email": email, "password": password})

	status, data, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", previous, string(body))
	if status != 200 {
		t.Fatalf("login %d: %s", status, data)
	}

	var session auth.Session
	if err := json.Unmarshal(data, &session); err != nil {
		t.Fatal(err)
	}

	return session
}

func TestSwitchAccountRevokesOldTokenAndLogoutCannotBeResurrected(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, alice.Token, "bob@example.test", "bob secret")
	if bob.User.Goals != (auth.FoodValue{Proteins: 80, Fats: 60, Carbs: 150, Calories: 1700}) || alice.User.Goals.Calories != 2000 {
		t.Fatal("personal goals/defaults were not isolated")
	}
	if alice.Token == bob.Token || alice.User.ID == bob.User.ID || alice.User.PersonalSpaceID == bob.User.PersonalSpaceID {
		t.Fatal("account context inherited")
	}

	status, _, _ := authRequest(t, server.URL, "GET", "/v1/auth/me", alice.Token, "")
	if status != 401 {
		t.Fatal("old token still valid")
	}

	var wg sync.WaitGroup
	for range 10 {
		wg.Go(func() { authRequest(t, server.URL, "GET", "/v1/auth/me", bob.Token, "") })
	}

	status, body, _ := authRequest(t, server.URL, "POST", "/v1/auth/logout", bob.Token, "")
	if status != 204 || len(body) != 0 {
		t.Fatalf("logout %d: %s", status, body)
	}

	wg.Wait()

	status, _, _ = authRequest(t, server.URL, "GET", "/v1/auth/me", bob.Token, "")
	if status != 401 {
		t.Fatal("session resurrected")
	}

	status, _, _ = authRequest(t, server.URL, "POST", "/v1/auth/logout", bob.Token, "")
	if status != 204 {
		t.Fatal("logout not idempotent")
	}
}

func TestSessionSurvivesRestartAndExpiresWithoutSliding(t *testing.T) {
	options := auth.DefaultOptions()
	options.Lifetime = 5 * time.Second
	server, dsn := authServer(t, options)
	session := login(t, server, "", "alice@example.test", "  alice secret  ")

	// Новый пул и SCS-manager имитируют новый процесс с прежней PostgreSQL.
	parsed, _ := url.Parse(dsn)
	parsed.User = url.UserPassword("fatbook_api", "local-api")

	db, err := database.New(context.Background(), parsed.String(), 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	service, err := auth.New(context.Background(), dsn, db, options)
	if err != nil {
		t.Fatal(err)
	}
	defer service.Close()

	e := httpapi.New(db, slog.New(slog.NewJSONHandler(io.Discard, nil)))
	httpapi.RegisterAuth(e, service)
	restarted := httptest.NewServer(e)
	defer restarted.Close()

	status, data, _ := authRequest(t, restarted.URL, "GET", "/v1/auth/me", session.Token, "")
	if status != 200 {
		t.Fatalf("restart %d: %s", status, data)
	}

	var state auth.State
	json.Unmarshal(data, &state)
	if !state.ExpiresAt.Equal(session.ExpiresAt) {
		t.Fatal("expiry changed")
	}

	time.Sleep(time.Until(session.ExpiresAt) + 20*time.Millisecond)

	status, _, _ = authRequest(t, restarted.URL, "GET", "/v1/auth/me", session.Token, "")
	if status != 401 {
		t.Fatal("expired session accepted")
	}
}

func TestLoginRateLimitHasRetryAfter(t *testing.T) {
	options := auth.DefaultOptions()
	options.LoginBurst = 1
	options.LoginInterval = time.Minute
	server, _ := authServer(t, options)
	login(t, server, "", "alice@example.test", "  alice secret  ")

	status, data, headers := authRequest(t, server.URL, "POST", "/v1/auth/login", "", `{"email":"alice@example.test","password":"wrong"}`)
	if status != 429 || headers.Get("Retry-After") != "60" || !strings.Contains(string(data), `"code":"rate_limited"`) {
		t.Fatalf("limit %d headers=%v: %s", status, headers, data)
	}
}

func TestAuthDatabaseFailureReturns503WithoutFalseLogin(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	session := login(t, server, "", "alice@example.test", "  alice secret  ")

	parsed, _ := url.Parse(dsn)
	parsed.User = url.UserPassword("fatbook_migrator", "local-migrator")
	conn, err := pgx.Connect(context.Background(), parsed.String())
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(context.Background())

	// Настоящий отказ сохранения, без подмены хранилища SCS.
	if _, err := conn.Exec(context.Background(), "ALTER TABLE auth.sessions RENAME TO sessions_unavailable"); err != nil {
		t.Fatal(err)
	}

	for _, req := range []struct{ method, path, body string }{
		{"GET", "/v1/auth/me", ""}, {"POST", "/v1/auth/logout", ""},
		{"POST", "/v1/auth/login", `{"email":"alice@example.test","password":"  alice secret  "}`},
	} {
		token := session.Token
		if req.path == "/v1/auth/login" {
			token = ""
		}
		status, data, _ := authRequest(t, server.URL, req.method, req.path, token, req.body)
		if status != 503 || strings.Contains(string(data), "token") {
			t.Fatalf("storage failure %d: %s", status, data)
		}
	}
}

func TestLoginConcurrencyIsBounded(t *testing.T) {
	options := auth.DefaultOptions()
	options.LoginConcurrency = 1
	options.LoginBurst = 30
	server, _ := authServer(t, options)

	start := make(chan struct{})
	results := make(chan int, 20)
	for range 20 {
		go func() {
			<-start
			status, _, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", "", `{"email":"missing@example.test","password":"wrong"}`)
			results <- status
		}()
	}

	close(start)
	limited := 0
	for range 20 {
		status := <-results
		if status == 429 {
			limited++
		} else if status != 401 {
			t.Fatalf("unexpected status %d", status)
		}
	}

	if limited == 0 {
		t.Fatal("parallel password checks were not limited")
	}
}

var contractResponses = sync.OnceValues(func() (map[string]*jsonschema.Schema, error) {
	raw, err := os.ReadFile("../../openapi.json")
	if err != nil {
		return nil, err
	}

	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		return nil, err
	}

	compiler := jsonschema.NewCompiler()
	compiler.AssertFormat()
	const base = "https://fatbook.test/openapi.json"
	if err := compiler.AddResource(base, doc); err != nil {
		return nil, err
	}

	result := map[string]*jsonschema.Schema{}
	for path, methods := range doc["paths"].(map[string]any) {
		for method, operation := range methods.(map[string]any) {
			for status, raw := range operation.(map[string]any)["responses"].(map[string]any) {
				content, ok := raw.(map[string]any)["content"].(map[string]any)
				if !ok {
					continue
				}
				schemaRef := content["application/json"].(map[string]any)["schema"].(map[string]any)["$ref"].(string)
				schema, err := compiler.Compile(base + schemaRef)
				if err != nil {
					return nil, err
				}
				result[strings.ToUpper(method)+" "+path+" "+status] = schema
			}
		}
	}

	return result, nil
})

func validateAuthContract(t *testing.T, method, path string, response *http.Response, body []byte) {
	t.Helper()

	schemas, err := contractResponses()
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode == 204 {
		if len(body) != 0 {
			t.Fatal("204 has a body")
		}
		return
	}

	path = strings.Split(path, "?")[0]
	if strings.HasPrefix(path, "/v1/dishes/") {
		path = "/v1/dishes/{id}"
	}
	schema := schemas[method+" "+path+" "+strconv.Itoa(response.StatusCode)]
	if schema == nil {
		t.Fatalf("response absent in OpenAPI: %s %s %d", method, path, response.StatusCode)
	}

	var value any
	if err := json.Unmarshal(body, &value); err != nil {
		t.Fatal(err)
	}
	if err := schema.Validate(value); err != nil {
		t.Fatal(fmt.Errorf("response violates OpenAPI: %w", err))
	}

	if response.StatusCode >= 400 {
		requestID := value.(map[string]any)["requestId"]
		if requestID != response.Header.Get("X-Request-ID") {
			t.Fatal("error requestId differs from header")
		}
	}
}

func TestLoginRequiresConfirmedSessionWrite(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	session := login(t, server, "", "alice@example.test", "  alice secret  ")

	parsed, _ := url.Parse(dsn)
	parsed.User = url.UserPassword("fatbook_migrator", "local-migrator")
	conn, err := pgx.Connect(context.Background(), parsed.String())
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(context.Background())
	if _, err := conn.Exec(context.Background(), "REVOKE INSERT ON auth.sessions FROM fatbook_auth"); err != nil {
		t.Fatal(err)
	}

	status, data, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", "", `{"email":"alice@example.test","password":"  alice secret  "}`)
	if status != 503 || strings.Contains(string(data), `"token"`) {
		t.Fatalf("failed persistence returned %d: %s", status, data)
	}

	status, _, _ = authRequest(t, server.URL, "GET", "/v1/auth/me", session.Token, "")
	if status != 200 {
		t.Fatal("unrelated existing session lost")
	}
}

func TestLoginRejectsInvalidPreviousBearer(t *testing.T) {
	options := auth.DefaultOptions()
	options.Lifetime = time.Second
	options.LoginBurst = 10
	server, _ := authServer(t, options)
	revoked := login(t, server, "", "alice@example.test", "  alice secret  ")
	authRequest(t, server.URL, "POST", "/v1/auth/logout", revoked.Token, "")
	expired := login(t, server, "", "alice@example.test", "  alice secret  ")

	time.Sleep(time.Until(expired.ExpiresAt) + 20*time.Millisecond)

	for _, token := range []string{"forged-token", revoked.Token, expired.Token} {
		status, data, _ := authRequest(t, server.URL, "POST", "/v1/auth/login", token, `{"email":"bob@example.test","password":"bob secret"}`)
		if status != 401 || !strings.Contains(string(data), `"code":"unauthenticated"`) {
			t.Fatalf("invalid Bearer replaced: %d %s", status, data)
		}
	}
}

func TestMobileSessionThroughRealHTTP(t *testing.T) {
	options := auth.DefaultOptions()
	options.LoginBurst = 20
	server, dsn := authServer(t, options)

	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node.js and npm ci are required for the TypeScript HTTP integration test")
	}
	root, err := filepath.Abs("../../../..")
	if err != nil {
		t.Fatal(err)
	}

	compiler := filepath.Join(root, "node_modules/typescript/bin/tsc")
	if _, err := os.Stat(compiler); err != nil {
		t.Skip("npm ci is required for the TypeScript HTTP integration test")
	}

	compiled := t.TempDir()
	command := exec.Command(node, compiler, "--target", "ES2022", "--module", "commonjs", "--skipLibCheck", "--outDir", compiled, "packages/api-client/src/go/session.ts")
	command.Dir = root
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("TypeScript compile: %v\n%s", err, output)
	}

	tokenFile := filepath.Join(t.TempDir(), "token")
	run := func(phase string) {
		t.Helper()

		command := exec.Command(node, filepath.Join(root, "apps/api/internal/httpapi/client-test.cjs"), compiled, server.URL, tokenFile, phase)
		if output, err := command.CombinedOutput(); err != nil {
			t.Fatalf("TypeScript HTTP %s: %v\n%s", phase, err, output)
		}
	}

	run("basic")

	parsed, _ := url.Parse(dsn)
	parsed.User = url.UserPassword("fatbook_migrator", "local-migrator")
	admin, err := pgx.Connect(context.Background(), parsed.String())
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close(context.Background())
	if _, err := admin.Exec(context.Background(), "REVOKE SELECT ON auth.sessions FROM fatbook_auth"); err != nil {
		t.Fatal(err)
	}

	run("outage")
	if _, err := admin.Exec(context.Background(), "GRANT SELECT ON auth.sessions TO fatbook_auth"); err != nil {
		t.Fatal(err)
	}

	run("recovery")
}
