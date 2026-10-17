package httpapi_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"math"
	"net/url"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"sync"
	"testing"
)

const recipeBody = `{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","name":" Рецепт A/B ","icon":null,"defaultPortion":null,"cookedWeight":400,"ingredients":[{"dishId":1,"portion":200},{"dishId":2,"portion":300}]}`

func TestRecipeCreationPersistsCalculatedSnapshots(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	session := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, body, _ := authRequest(t, server.URL, "POST", "/v1/dishes", session.Token, recipeBody)
	if status != 201 {
		t.Fatalf("create %d: %s", status, body)
	}
	var dish struct {
		ID           int64   `json:"id"`
		Name         string  `json:"name"`
		CookedWeight float64 `json:"cookedWeight"`
		Proteins     float64 `json:"proteins"`
		Fats         float64 `json:"fats"`
		Carbs        float64 `json:"carbs"`
		Calories     float64 `json:"calories"`
		Ingredients  []struct {
			Calories       float64 `json:"calories"`
			SourceSnapshot struct {
				Name     string  `json:"name"`
				Calories float64 `json:"calories"`
			} `json:"sourceSnapshot"`
		} `json:"ingredients"`
	}
	if err := json.Unmarshal(body, &dish); err != nil {
		t.Fatal(err)
	}
	if dish.Name != "Рецепт A/B" || dish.CookedWeight != 400 || dish.Proteins != 8.75 || dish.Fats != 4 || dish.Carbs != 17.5 || dish.Calories != 148.75 || len(dish.Ingredients) != 2 {
		t.Fatalf("recipe: %s", body)
	}
	if dish.Ingredients[0].Calories != 340 || dish.Ingredients[0].SourceSnapshot.Calories != 170 || dish.Ingredients[0].SourceSnapshot.Name != "Ингредиент A" {
		t.Fatalf("snapshot: %s", body)
	}
	status, loaded, _ := authRequest(t, server.URL, "GET", fmt.Sprintf("/v1/dishes/%d", dish.ID), session.Token, "")
	if status != 200 {
		t.Fatalf("read %d: %s", status, loaded)
	}
	var original, restored map[string]any
	json.Unmarshal(body, &original)
	json.Unmarshal(loaded, &restored)
	if !reflect.DeepEqual(original, restored) {
		t.Fatalf("stored dish differs: %s", loaded)
	}
}

func TestDishSearchAndAccess(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, "", "bob@example.test", "bob secret")
	status, body, _ := authRequest(t, server.URL, "GET", "/v1/dishes?scope=ingredients", alice.Token, "")
	if status != 200 {
		t.Fatalf("list %d: %s", status, body)
	}
	var page struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
		Page, PageSize int
		HasMore        bool
	}
	json.Unmarshal(body, &page)
	if len(page.Items) != 3 || page.Page != 1 || page.PageSize != 25 || page.HasMore {
		t.Fatalf("ingredients: %s", body)
	}
	status, body, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("create %d: %s", status, body)
	}
	var dish struct {
		ID int64 `json:"id"`
	}
	json.Unmarshal(body, &dish)
	for _, req := range []struct {
		path, token string
		status      int
	}{
		{"/v1/dishes", alice.Token, 200}, {"/v1/dishes?scope=ingredients", bob.Token, 200},
		{fmt.Sprintf("/v1/dishes/%d", dish.ID), bob.Token, 404}, {"/v1/dishes/4", alice.Token, 404},
		{"/v1/dishes/1", alice.Token, 200}, {"/v1/dishes/1", "", 401},
		{"/v1/dishes?scope=all", alice.Token, 422},
		{"/v1/dishes?q=bad;query", alice.Token, 400}, {"/v1/dishes?page=0", alice.Token, 422},
		{"/v1/dishes?page=1.5", alice.Token, 400}, {"/v1/dishes?page=1&page=2", alice.Token, 400},
		{"/v1/dishes?userId=alice", alice.Token, 400}, {"/v1/dishes/1?x=1", alice.Token, 400},
	} {
		status, data, _ := authRequest(t, server.URL, "GET", req.path, req.token, "")
		if status != req.status {
			t.Fatalf("%s: %d %s", req.path, status, data)
		}
	}
	status, body, _ = authRequest(t, server.URL, "GET", "/v1/dishes", bob.Token, "")
	json.Unmarshal(body, &page)
	if status != 200 || len(page.Items) != 0 {
		t.Fatalf("foreign library: %s", body)
	}
}

func dishAdmin(t *testing.T, dsn string) *pgx.Conn {
	t.Helper()
	parsed, _ := url.Parse(dsn)
	parsed.User = url.UserPassword("fatbook_migrator", "local-migrator")
	conn, err := pgx.Connect(context.Background(), parsed.String())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close(context.Background()) })
	return conn
}
func TestRecipeReplayIsAtomicConcurrentAndUserScoped(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, "", "bob@example.test", "bob secret")
	var wg sync.WaitGroup
	results := make(chan []byte, 8)
	for range 8 {
		wg.Go(func() {
			status, body, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
			if status != 201 {
				t.Errorf("concurrent create %d: %s", status, body)
			}
			results <- body
		})
	}
	wg.Wait()
	close(results)
	var first map[string]any
	for raw := range results {
		var result map[string]any
		json.Unmarshal(raw, &result)
		if first == nil {
			first = result
		} else if !reflect.DeepEqual(first, result) {
			t.Fatalf("duplicate result: %s", raw)
		}
	}
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET name='Changed source',calories=999 WHERE id=1`); err != nil {
		t.Fatal(err)
	}
	normalized := strings.Replace(recipeBody, `" Рецепт A/B "`, `"Рецепт A/B"`, 1)
	normalized = strings.Replace(normalized, `[{"dishId":1,"portion":200},{"dishId":2,"portion":300}]`, `[{"portion":300.0,"dishId":2},{"portion":200.0,"dishId":1}]`, 1)
	normalized = strings.ReplaceAll(normalized, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA")
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, normalized)
	var result map[string]any
	json.Unmarshal(raw, &result)
	if status != 201 || !reflect.DeepEqual(first, result) {
		t.Fatalf("normalized replay: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", fmt.Sprintf("/v1/dishes/%.0f", first["id"]), alice.Token, "")
	json.Unmarshal(raw, &result)
	if status != 200 || !reflect.DeepEqual(first, result) {
		t.Fatalf("snapshot changed: %s", raw)
	}
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, strings.Replace(recipeBody, `"cookedWeight":400`, `"cookedWeight":500`, 1))
	if status != 409 || !strings.Contains(string(raw), "idempotency_conflict") {
		t.Fatalf("conflict %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/dishes", bob.Token, recipeBody)
	json.Unmarshal(raw, &result)
	if status != 201 || result["id"] == first["id"] || result["spaceId"] == first["spaceId"] {
		t.Fatalf("cross-user key: %s", raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/dishes", alice.Token, "")
	var page struct {
		Items []json.RawMessage `json:"items"`
	}
	json.Unmarshal(raw, &page)
	if status != 200 || len(page.Items) != 1 {
		t.Fatalf("duplicated recipes: %s", raw)
	}
}

func TestRecipeInvalidInputsLeaveNoPartialCreation(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	for _, tc := range []struct {
		from, to string
		status   int
	}{
		{`"name":" Рецепт A/B "`, `"name":" "`, 422},
		{`"name":" Рецепт A/B "`, `"name":42`, 400},
		{`"icon":null`, `"icon":12`, 400},
		{`"icon":null,`, ``, 400},
		{`"cookedWeight":400`, `"cookedWeight":0`, 422},
		{`"cookedWeight":400`, `"cookedWeight":-1`, 422},
		{`"cookedWeight":400`, `"cookedWeight":"400"`, 400},
		{`"cookedWeight":400`, `"cookedWeight":null`, 400},
		{`"cookedWeight":400`, `"cookedWeight":1e400`, 400},
		{`"defaultPortion":null`, `"defaultPortion":0`, 422},
		{`"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"`, `"clientRequestId":"invalid"`, 422},
		{`"dishId":2`, `"dishId":4`, 404},
		{`"dishId":2`, `"dishId":99999`, 404},
		{`"dishId":2`, `"dishId":1`, 422},
		{`"dishId":2`, `"dishId":9007199254740992`, 422},
		{`"dishId":2`, `"dishId":null`, 400},
		{`"portion":300`, `"portion":0`, 422},
		{`"portion":300`, `"portion":-1`, 422},
		{`"portion":300`, `"portion":null`, 400},
		{`"portion":300`, `"portion":"300"`, 400},
		{`"ingredients":[{"dishId":1,"portion":200},{"dishId":2,"portion":300}]`, `"ingredients":[]`, 422},
		{`"ingredients":[{"dishId":1,"portion":200},{"dishId":2,"portion":300}]`, `"ingredients":null`, 400},
		{`"name":`, `"userId":"11111111-1111-4111-8111-111111111111","name":`, 400},
		{`"name":`, `"spaceId":2,"name":`, 400},
		{`"name":`, `"collectionId":2,"name":`, 400},
		{`"portion":300`, `"portion":300,"calories":0`, 400},
		{`"name":`, `"calories":0,"name":`, 400},
		{`"portion":200`, `"portion":1.79e308`, 422},
	} {
		status, body, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, strings.Replace(recipeBody, tc.from, tc.to, 1))
		if status != tc.status {
			t.Fatalf("%s: %d %s", tc.to, status, body)
		}
		status, body, _ = authRequest(t, server.URL, "GET", "/v1/dishes", alice.Token, "")
		var page struct {
			Items []json.RawMessage `json:"items"`
		}
		json.Unmarshal(body, &page)
		if status != 200 || len(page.Items) != 0 {
			t.Fatalf("partial recipe: %s", body)
		}
	}
	// Неуспешный запрос не занимает ключ. Вставка состава и receipt тоже откатываются.
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET deleted_at=now() WHERE id=2`); err != nil {
		t.Fatal(err)
	}
	status, body, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 404 {
		t.Fatalf("deleted source: %d %s", status, body)
	}
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET deleted_at=NULL WHERE id=2`); err != nil {
		t.Fatal(err)
	}
	if _, err := admin.Exec(context.Background(), `REVOKE INSERT ON app.creation_requests FROM fatbook_user`); err != nil {
		t.Fatal(err)
	}
	status, _, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 500 {
		t.Fatalf("receipt failure: %d", status)
	}
	if _, err := admin.Exec(context.Background(), `GRANT INSERT ON app.creation_requests TO fatbook_user`); err != nil {
		t.Fatal(err)
	}
	status, body, _ = authRequest(t, server.URL, "GET", "/v1/dishes", alice.Token, "")
	if status != 200 || !strings.Contains(string(body), `"items":[]`) {
		t.Fatalf("transaction leaked: %s", body)
	}
	status, body, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("retry after validation: %d %s", status, body)
	}
	var parent struct {
		ID int64 `json:"id"`
	}
	json.Unmarshal(body, &parent)
	nested := strings.ReplaceAll(recipeBody, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
	nested = strings.Replace(nested, `"dishId":2`, fmt.Sprintf(`"dishId":%d`, parent.ID), 1)
	status, body, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, nested)
	if status != 422 || !strings.Contains(string(body), "nested_recipe") {
		t.Fatalf("nested recipe: %d %s", status, body)
	}
}

func TestRecipeSupportsLargerCookedWeightAndFractions(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	body := strings.Replace(recipeBody, `"cookedWeight":400`, `"cookedWeight":800.5`, 1)
	body = strings.Replace(body, `"portion":200`, `"portion":200.25`, 1)
	body = strings.Replace(body, `"portion":300`, `"portion":300.75`, 1)
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, body)
	var dish struct{ CookedWeight, Proteins, Calories float64 }
	json.Unmarshal(raw, &dish)
	if status != 201 || dish.CookedWeight != 800.5 || math.Abs(dish.Proteins-4.380074953154279) > 0.000001 || math.Abs(dish.Calories-74.46127420362274) > 0.000001 {
		t.Fatalf("fractional recipe: %d %s", status, raw)
	}
}

func TestDishSearchLiteralCharactersAndPagination(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `INSERT INTO app.dishes(name,proteins,fats,carbs,calories) SELECT 'Page product',1,1,1,1 FROM generate_series(1,27);
 INSERT INTO app.dishes(name,proteins,fats,carbs,calories) VALUES ('Literal %_\ marker',0,0,0,0),('Literal ordinary marker',0,0,0,0);`); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		q           string
		page, count int
		more        bool
	}{
		{"  PAGE PRODUCT  ", 1, 25, true}, {"Page product", 2, 2, false}, {"Page product", 3, 0, false},
		{"иНГРЕДИЕНТ A", 1, 1, false},
		{"%_\\", 1, 1, false}, {"%", 1, 1, false}, {"_", 1, 1, false}, {"\\", 1, 1, false},
	} {
		path := fmt.Sprintf("/v1/dishes?scope=ingredients&q=%s&page=%d", url.QueryEscape(tc.q), tc.page)
		status, body, _ := authRequest(t, server.URL, "GET", path, alice.Token, "")
		var page struct {
			Items []struct {
				ID int64 `json:"id"`
			} `json:"items"`
			HasMore bool `json:"hasMore"`
		}
		json.Unmarshal(body, &page)
		if status != 200 || len(page.Items) != tc.count || page.HasMore != tc.more {
			t.Fatalf("%s: %d %s", path, status, body)
		}
		for i := 1; i < len(page.Items); i++ {
			if page.Items[i-1].ID >= page.Items[i].ID {
				t.Fatal("equal names must sort by id")
			}
		}
	}
	status, _, _ := authRequest(t, server.URL, "GET", "/v1/dishes?q="+url.QueryEscape(strings.Repeat("я", 101)), alice.Token, "")
	if status != 422 {
		t.Fatalf("long search: %d", status)
	}
	status, body, _ := authRequest(t, server.URL, "GET", "/v1/dishes?q="+url.QueryEscape(strings.Repeat("я", 100)), alice.Token, "")
	if status != 200 {
		t.Fatalf("Unicode length: %d %s", status, body)
	}
}

func TestMobileRecipeDraftThroughRealHTTP(t *testing.T) {
	options := auth.DefaultOptions()
	options.LoginBurst = 10
	server, _ := authServer(t, options)
	root, err := filepath.Abs("../../../..")
	if err != nil {
		t.Fatal(err)
	}
	node, err := exec.LookPath("node")
	if err != nil {
		t.Fatal("Node.js required for recipe transport checks")
	}
	compiled := t.TempDir()
	command := exec.Command(node, filepath.Join(root, "node_modules/typescript/bin/tsc"), "--target", "ES2022", "--module", "Node16", "--moduleResolution", "Node16", "--esModuleInterop", "--skipLibCheck", "--strict", "--outDir", compiled, "packages/api-client/src/go/index.ts", "apps/mobile/src/data/go-data.ts")
	command.Dir = root
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("TypeScript: %v\n%s", err, output)
	}
	command = exec.Command(node, filepath.Join(root, "apps/api/internal/httpapi/recipe-client-test.cjs"), compiled, server.URL)
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("recipe HTTP transport: %v\n%s", err, output)
	}
}

func TestRecipeAndSearchLimitsApplyAfterTrim(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	boundaryName := strings.Repeat("я", 100)
	body := strings.Replace(recipeBody, " Рецепт A/B ", "  "+boundaryName+"  ", 1)
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, body)
	if status != 201 {
		t.Fatalf("trimmed name boundary: %d %s", status, raw)
	}
	var result struct {
		Name string `json:"name"`
	}
	json.Unmarshal(raw, &result)
	if result.Name != boundaryName {
		t.Fatalf("untrimmed result: %s", raw)
	}
	body = strings.Replace(body, boundaryName, boundaryName+"я", 1)
	status, _, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, body)
	if status != 422 {
		t.Fatalf("name length: %d", status)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/dishes?q="+url.QueryEscape("  "+boundaryName+"  "), alice.Token, "")
	if status != 200 {
		t.Fatalf("trimmed query boundary: %d %s", status, raw)
	}
}
