package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/sketchyy/fatbook/apps/api/internal/auth"
)

func TestEatingStoresRecipeSnapshotAndDailyTotals(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("recipe: %d %s", status, raw)
	}
	var dish struct{ ID int64 }
	if err := json.Unmarshal(raw, &dish); err != nil {
		t.Fatal(err)
	}

	input := fmt.Sprintf(`{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":%d,"day":"2026-10-18","meal":"lunch","portion":150}`, dish.ID)
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 {
		t.Fatalf("eating: %d %s", status, raw)
	}
	var eating struct {
		ID                                       int64
		Day, Meal                                string
		Portion, Proteins, Fats, Carbs, Calories float64
		DishSnapshot                             struct {
			Name                            string
			Proteins, Fats, Carbs, Calories float64
		}
	}
	if err := json.Unmarshal(raw, &eating); err != nil {
		t.Fatal(err)
	}
	if eating.ID < 1 || eating.Day != "2026-10-18" || eating.Meal != "lunch" || eating.Portion != 150 || eating.Proteins != 13.125 || eating.Fats != 6 || eating.Carbs != 26.25 || eating.Calories != 223.125 || eating.DishSnapshot.Name != "Рецепт A/B" || eating.DishSnapshot.Calories != 148.75 {
		t.Fatalf("snapshot: %s", raw)
	}

	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	var daily struct {
		Day                             string
		Proteins, Fats, Carbs, Calories float64
		Meals                           map[string]struct {
			Calories float64
			Eatings  []json.RawMessage
		}
	}
	if err := json.Unmarshal(raw, &daily); err != nil {
		t.Fatal(err)
	}
	if status != 200 || daily.Day != "2026-10-18" || daily.Proteins != 13.125 || daily.Fats != 6 || daily.Carbs != 26.25 || daily.Calories != 223.125 || len(daily.Meals) != 4 || len(daily.Meals["lunch"].Eatings) != 1 || daily.Meals["lunch"].Calories != 223.125 || len(daily.Meals["breakfast"].Eatings) != 0 {
		t.Fatalf("daily: %d %s", status, raw)
	}
}

func TestEatingHistoryAndPersonalMutations(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, "", "bob@example.test", "bob secret")
	input := `{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":3,"day":"2026-10-18","meal":"snack","portion":150}`
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 {
		t.Fatalf("create: %d %s", status, raw)
	}
	var created struct{ ID int64 }
	json.Unmarshal(raw, &created)
	path := fmt.Sprintf("/v1/eatings/%d", created.ID)
	for _, method := range []string{"PATCH", "DELETE"} {
		body := ""
		if method == "PATCH" {
			body = `{"portion":100}`
		}
		status, raw, _ = authRequest(t, server.URL, method, path, bob.Token, body)
		if status != 404 {
			t.Fatalf("foreign %s: %d %s", method, status, raw)
		}
	}

	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET name='Changed',icon='new',proteins=90,calories=900,deleted_at=now() WHERE id=3`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ = authRequest(t, server.URL, "PATCH", path, alice.Token, `{"portion":100}`)
	var updated struct {
		Portion, Proteins, Calories float64
		DishSnapshot                struct {
			Name     string
			Proteins float64
		}
	}
	json.Unmarshal(raw, &updated)
	if status != 200 || updated.Portion != 100 || updated.Proteins != 12 || updated.Calories != 110 || updated.DishSnapshot.Name != "Продукт Алисы" || updated.DishSnapshot.Proteins != 12 {
		t.Fatalf("historical update: %d %s", status, raw)
	}

	status, raw, _ = authRequest(t, server.URL, "DELETE", path, alice.Token, "")
	if status != 204 {
		t.Fatalf("delete: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	var daily struct {
		Calories float64
		Meals    map[string]struct {
			Eatings  []json.RawMessage
			Calories float64
		}
	}
	json.Unmarshal(raw, &daily)
	if status != 200 || daily.Calories != 0 || len(daily.Meals) != 4 {
		t.Fatalf("empty day: %d %s", status, raw)
	}
	for _, meal := range daily.Meals {
		if meal.Eatings == nil || len(meal.Eatings) != 0 || meal.Calories != 0 {
			t.Fatalf("empty meal: %s", raw)
		}
	}
}

func TestEatingDeduplicatesConcurrentPostsAndPreservesOriginalResponse(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, "", "bob@example.test", "bob secret")
	input := `{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":1,"day":"2026-10-18","meal":"breakfast","portion":150}`
	const workers = 8
	results := make(chan []byte, workers)
	var wg sync.WaitGroup
	for range workers {
		wg.Go(func() {
			status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
			if status != 201 {
				t.Errorf("concurrent create: %d %s", status, raw)
			}
			results <- raw
		})
	}
	wg.Wait()
	close(results)
	var original []byte
	for raw := range results {
		if original == nil {
			original = raw
		}
		if !bytes.Equal(original, raw) {
			t.Fatalf("replay changed: %s / %s", original, raw)
		}
	}
	var eating struct{ ID int64 }
	json.Unmarshal(original, &eating)
	path := fmt.Sprintf("/v1/eatings/%d", eating.ID)
	status, _, _ := authRequest(t, server.URL, "PATCH", path, alice.Token, `{"portion":100}`)
	if status != 200 {
		t.Fatalf("patch: %d", status)
	}
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET proteins=99,calories=999,deleted_at=now() WHERE id=1`); err != nil {
		t.Fatal(err)
	}
	normalized := strings.ReplaceAll(input, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA")
	normalized = strings.Replace(normalized, `"portion":150`, `"portion":150.0`, 1)
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, normalized)
	if status != 201 || !bytes.Equal(original, raw) {
		t.Fatalf("original response lost: %d %s", status, raw)
	}
	status, _, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, strings.Replace(input, `"portion":150`, `"portion":151`, 1))
	if status != 409 {
		t.Fatalf("conflict: %d", status)
	}
	authRequest(t, server.URL, "DELETE", path, alice.Token, "")
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 || !bytes.Equal(original, raw) {
		t.Fatalf("deleted replay: %d %s", status, raw)
	}
	// Receipt A не раскрывается B даже с тем же ключом.
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", bob.Token, input)
	if status != 404 {
		t.Fatalf("other user replay: %d %s", status, raw)
	}
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET deleted_at=NULL WHERE id=1`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", bob.Token, input)
	var other struct{ ID int64 }
	json.Unmarshal(raw, &other)
	if status != 201 || other.ID == eating.ID {
		t.Fatalf("other user's key: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	if status != 200 || !strings.Contains(string(raw), `"calories":0`) {
		t.Fatalf("duplicate entry: %d %s", status, raw)
	}
}

func TestEatingValidationAccessAndCalendarDates(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	input := `{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":1,"day":"2024-02-29","meal":"dinner","portion":150}`
	for _, tc := range []struct {
		old, new string
		status   int
	}{
		{`"dishId":1`, `"dishId":4`, 404}, {`"dishId":1`, `"dishId":99999`, 404},
		{`"dishId":1`, `"dishId":0`, 422}, {`"dishId":1`, `"dishId":9007199254740992`, 422},
		{`"portion":150`, `"portion":0`, 422}, {`"portion":150`, `"portion":-1`, 422}, {`"portion":150`, `"portion":1.79e308`, 422},
		{`"portion":150`, `"portion":"150"`, 400}, {`"portion":150`, `"portion":null`, 400},
		{`"portion":150`, `"portion":150,"userId":"11111111-1111-4111-8111-111111111111"`, 400},
		{`"portion":150`, `"portion":150,"calories":1`, 400},
		{`"meal":"dinner"`, `"meal":"brunch"`, 422}, {`"day":"2024-02-29"`, `"day":"2025-02-29"`, 422},
		{`"day":"2024-02-29"`, `"day":"2026-02-30"`, 422}, {`"day":"2024-02-29"`, `"day":"0000-01-01"`, 422},
		{`"day":"2024-02-29"`, `"day":"2026-1-01"`, 422}, {`"day":"2024-02-29"`, `"day":"2026-10-18T00:00:00Z"`, 422},
		{`"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"`, `"clientRequestId":"bad"`, 422},
	} {
		status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, strings.Replace(input, tc.old, tc.new, 1))
		if status != tc.status {
			t.Fatalf("%s: %d %s", tc.new, status, raw)
		}
	}
	for _, tc := range []struct {
		query  string
		status int
	}{
		{"", 400}, {"?day=2026-10-18&userId=1", 400}, {"?day=2026-10-18&day=2026-10-19", 400}, {"?day=2026-10-18&token=abc", 400}, {"?day=%zz", 400},
		{"?day=2026-02-30", 422}, {"?day=2026-1-01", 422}, {"?day=0000-01-01", 422}, {"?day=2024-02-29", 200},
	} {
		status, raw, _ := authRequest(t, server.URL, "GET", "/v1/eatings"+tc.query, alice.Token, "")
		if status != tc.status {
			t.Fatalf("%s: %d %s", tc.query, status, raw)
		}
	}
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 {
		t.Fatalf("failed request occupied key: %d %s", status, raw)
	}
	var created struct{ ID int64 }
	json.Unmarshal(raw, &created)
	path := fmt.Sprintf("/v1/eatings/%d", created.ID)
	for _, body := range []string{`{}`, `{"portion":null}`, `{"portion":"100"}`, `{"portion":100,"day":"2026-10-18"}`, `{"portion":100,"dishId":2}`, `{"portion":100,"dishSnapshot":{}}`} {
		status, raw, _ := authRequest(t, server.URL, "PATCH", path, alice.Token, body)
		if status != 400 {
			t.Fatalf("patch body %s: %d %s", body, status, raw)
		}
	}
	for _, body := range []string{`{"portion":0}`, `{"portion":-1}`, `{"portion":1.79e308}`} {
		status, raw, _ := authRequest(t, server.URL, "PATCH", path, alice.Token, body)
		if status != 422 {
			t.Fatalf("patch weight: %d %s", status, raw)
		}
	}
	for _, method := range []string{"GET", "POST", "PATCH", "DELETE"} {
		route := "/v1/eatings"
		body := input
		if method == "GET" {
			route += "?day=2024-02-29"
			body = ""
		}
		if method == "PATCH" || method == "DELETE" {
			route = path
			body = `{"portion":100}`
		}
		status, _, _ := authRequest(t, server.URL, method, route, "", body)
		if status != 401 {
			t.Fatalf("auth %s: %d", method, status)
		}
	}
}

func TestEatingDatabaseFailureIsNotEmptyDayAndRollsBackCreation(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	admin := dishAdmin(t, dsn)
	tx, err := admin.Begin(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(context.Background())
	if _, err := tx.Exec(context.Background(), `LOCK TABLE app.eatings IN ACCESS EXCLUSIVE MODE`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ := authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	if status != 503 || !strings.Contains(string(raw), `"code":"service_unavailable"`) {
		t.Fatalf("database failure: %d %s", status, raw)
	}
	if err := tx.Rollback(context.Background()); err != nil {
		t.Fatal(err)
	}

	input := `{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":1,"day":"2026-10-18","meal":"breakfast","portion":150}`
	if _, err := admin.Exec(context.Background(), `REVOKE INSERT ON app.creation_requests FROM fatbook_user`); err != nil {
		t.Fatal(err)
	}
	status, _, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 500 {
		t.Fatalf("receipt failure: %d", status)
	}
	if _, err := admin.Exec(context.Background(), `GRANT INSERT ON app.creation_requests TO fatbook_user`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	if status != 200 || !strings.Contains(string(raw), `"eatings":[]`) || !strings.Contains(string(raw), `"calories":0`) {
		t.Fatalf("partial entry: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 {
		t.Fatalf("retry: %d %s", status, raw)
	}
}

func TestMobileEatingDraftThroughRealHTTP(t *testing.T) {
	options := auth.DefaultOptions()
	options.LoginBurst = 20
	server, _ := authServer(t, options)
	root, err := filepath.Abs("../../../..")
	if err != nil {
		t.Fatal(err)
	}
	node, err := exec.LookPath("node")
	if err != nil {
		t.Fatal("Node.js required for diary transport checks")
	}
	compiled := t.TempDir()
	command := exec.Command(node, filepath.Join(root, "node_modules/typescript/bin/tsc"), "--target", "ES2022", "--module", "Node16", "--moduleResolution", "Node16", "--esModuleInterop", "--skipLibCheck", "--strict", "--outDir", compiled, "packages/api-client/src/go/index.ts", "apps/mobile/src/data/go-data.ts", "apps/mobile/src/data/diary-state.ts", "packages/shared/src/index.ts")
	command.Dir = root
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("TypeScript: %v\n%s", err, output)
	}
	for name, target := range map[string]string{"api-client/go": "packages/api-client/src/go", "shared": "packages/shared/src"} {
		link := filepath.Join(compiled, "node_modules/@fatbook", name)
		if err := os.MkdirAll(filepath.Dir(link), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.Symlink(filepath.Join(compiled, target), link); err != nil {
			t.Fatal(err)
		}
	}
	command = exec.Command(node, filepath.Join(root, "apps/api/internal/httpapi/eating-client-test.cjs"), compiled, server.URL)
	command.Env = append(os.Environ(), "NODE_PATH="+filepath.Join(root, "node_modules"))
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("diary HTTP transport: %v\n%s", err, output)
	}
}

func TestEatingSnapshotUsesOneConcurrentDishVersion(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	var recipe struct{ ID int64 }
	json.Unmarshal(raw, &recipe)
	if status != 201 {
		t.Fatalf("recipe: %d %s", status, raw)
	}
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET name='Before',icon='old' WHERE id=$1`, recipe.ID); err != nil {
		t.Fatal(err)
	}
	stop := make(chan struct{})
	done := make(chan error, 1)
	go func() {
		for {
			for _, sql := range []string{
				`UPDATE app.dishes SET name='After',icon='new',proteins=14,fats=6.4,carbs=28,calories=238 WHERE id=$1`,
				`UPDATE app.dishes SET name='Before',icon='old',proteins=8.75,fats=4,carbs=17.5,calories=148.75 WHERE id=$1`,
			} {
				select {
				case <-stop:
					done <- nil
					return
				default:
				}
				if _, err := admin.Exec(context.Background(), sql, recipe.ID); err != nil {
					done <- err
					return
				}
			}
		}
	}()
	defer func() {
		close(stop)
		if err := <-done; err != nil {
			t.Error(err)
		}
	}()
	for i := range 20 {
		input := fmt.Sprintf(`{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-%012d","dishId":%d,"day":"2026-10-18","meal":"lunch","portion":150}`, i, recipe.ID)
		status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
		var e struct {
			Proteins, Fats, Carbs, Calories float64
			DishSnapshot                    struct {
				Name, Icon                      string
				Proteins, Fats, Carbs, Calories float64
			}
		}
		json.Unmarshal(raw, &e)
		old := e.DishSnapshot.Name == "Before" && e.DishSnapshot.Icon == "old" && e.DishSnapshot.Proteins == 8.75 && e.DishSnapshot.Fats == 4 && e.DishSnapshot.Carbs == 17.5 && e.DishSnapshot.Calories == 148.75 && e.Proteins == 13.125 && e.Fats == 6 && e.Carbs == 26.25 && e.Calories == 223.125
		current := e.DishSnapshot.Name == "After" && e.DishSnapshot.Icon == "new" && e.DishSnapshot.Proteins == 14 && e.DishSnapshot.Fats == 6.4 && e.DishSnapshot.Carbs == 28 && e.DishSnapshot.Calories == 238 && e.Proteins == 21 && math.Abs(e.Fats-9.6) < 0.000001 && e.Carbs == 42 && e.Calories == 357
		if status != 201 || (!old && !current) {
			t.Fatalf("mixed version: %d %s", status, raw)
		}
	}
}

func TestEatingFractionsMultipleMealsAndMissingSource(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	for _, item := range []struct {
		key, meal string
		portion   float64
	}{
		{"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "breakfast", 150.25},
		{"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "dinner", 100.75},
	} {
		input := fmt.Sprintf(`{"clientRequestId":"%s","dishId":3,"day":"2026-10-18","meal":"%s","portion":%g}`, item.key, item.meal, item.portion)
		status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
		if status != 201 {
			t.Fatalf("fraction: %d %s", status, raw)
		}
	}
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `DELETE FROM app.dishes WHERE id=3`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ := authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	var daily struct {
		Proteins, Fats, Carbs, Calories float64
		Meals                           map[string]struct {
			Calories float64
			Eatings  []struct {
				ID           int64
				DishID       *int64
				DishSnapshot struct{ Name string }
			}
		}
	}
	json.Unmarshal(raw, &daily)
	if status != 200 || math.Abs(daily.Proteins-30.12) > 0.000001 || math.Abs(daily.Fats-7.53) > 0.000001 || math.Abs(daily.Carbs-20.08) > 0.000001 || math.Abs(daily.Calories-276.1) > 0.000001 || math.Abs(daily.Meals["breakfast"].Calories-165.275) > 0.000001 || math.Abs(daily.Meals["dinner"].Calories-110.825) > 0.000001 {
		t.Fatalf("fractional totals: %d %s", status, raw)
	}
	e := daily.Meals["breakfast"].Eatings[0]
	if e.DishID != nil || e.DishSnapshot.Name != "Продукт Алисы" {
		t.Fatalf("missing source broke history: %s", raw)
	}
	status, raw, _ = authRequest(t, server.URL, "PATCH", fmt.Sprintf("/v1/eatings/%d", e.ID), alice.Token, `{"portion":100}`)
	if status != 200 || !strings.Contains(string(raw), `"calories":110`) {
		t.Fatalf("missing source patch: %d %s", status, raw)
	}
}
