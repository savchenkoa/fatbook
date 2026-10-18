package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"strings"
	"sync"
	"testing"

	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
	"github.com/sketchyy/fatbook/apps/api/internal/eatings"
)

const recipeUpdate = `{"name":"Новая версия","icon":"🥘","defaultPortion":150,"cookedWeight":250,"ingredients":[{"dishId":1,"portion":200},{"dishId":2,"portion":300}]}`

func TestRecipeUpdatePreservesHistoryAndOriginalPost(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, original, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("create: %d %s", status, original)
	}
	var recipe dishes.Dish
	if err := json.Unmarshal(original, &recipe); err != nil {
		t.Fatal(err)
	}
	path := fmt.Sprintf("/v1/dishes/%d", recipe.ID)
	input := fmt.Sprintf(`{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":%d,"day":"2026-10-18","meal":"lunch","portion":150}`, recipe.ID)
	status, first, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 {
		t.Fatalf("first eating: %d %s", status, first)
	}

	// Изменение доступного источника не обновляет снимки прежнего состава.
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `UPDATE app.dishes SET name='Новый источник',icon='🍎',proteins=90,fats=80,carbs=70,calories=999 WHERE id=1`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ := authRequest(t, server.URL, "PUT", path, alice.Token, recipeUpdate)
	if status != 200 {
		t.Fatalf("update: %d %s", status, raw)
	}
	var updated dishes.Dish
	if err := json.Unmarshal(raw, &updated); err != nil {
		t.Fatal(err)
	}
	if updated.Name != "Новая версия" || updated.Icon == nil || *updated.Icon != "🥘" || updated.DefaultPortion == nil || *updated.DefaultPortion != 150 || updated.CookedWeight == nil || *updated.CookedWeight != 250 || !closeFoodValue(updated.FoodValue, dishes.FoodValue{Proteins: 14, Fats: 6.4, Carbs: 28, Calories: 238}) || len(updated.Ingredients) != 2 || !reflect.DeepEqual(updated.Ingredients[0].SourceSnapshot, recipe.Ingredients[0].SourceSnapshot) {
		t.Fatalf("updated recipe: %s", raw)
	}
	status, replay, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 || !bytes.Equal(original, replay) {
		t.Fatalf("recipe replay: %d %s", status, replay)
	}
	status, replay, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 || !bytes.Equal(first, replay) {
		t.Fatalf("eating replay: %d %s", status, replay)
	}
	input = string(bytes.ReplaceAll([]byte(input), []byte("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"), []byte("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")))
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	var second eatings.Eating
	if err := json.Unmarshal(raw, &second); err != nil {
		t.Fatal(err)
	}
	if status != 201 || second.DishSnapshot.Name != "Новая версия" || second.DishSnapshot.Icon == nil || *second.DishSnapshot.Icon != "🥘" || !closeFoodValue(second.FoodValue, dishes.FoodValue{Proteins: 21, Fats: 9.6, Carbs: 42, Calories: 357}) {
		t.Fatalf("new eating: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	var daily eatings.Daily
	if err := json.Unmarshal(raw, &daily); err != nil {
		t.Fatal(err)
	}
	if status != 200 || !closeFoodValue(daily.FoodValue, dishes.FoodValue{Proteins: 34.125, Fats: 15.6, Carbs: 68.25, Calories: 580.125}) || len(daily.Meals["lunch"].Eatings) != 2 || daily.Meals["lunch"].Eatings[0].DishSnapshot.Name != "Рецепт A/B" || daily.Meals["lunch"].Eatings[0].DishSnapshot.Icon != nil {
		t.Fatalf("daily history: %d %s", status, raw)
	}
}

func closeFoodValue(got, want dishes.FoodValue) bool {
	return math.Abs(got.Proteins-want.Proteins) < 0.000001 && math.Abs(got.Fats-want.Fats) < 0.000001 && math.Abs(got.Carbs-want.Carbs) < 0.000001 && math.Abs(got.Calories-want.Calories) < 0.000001
}

func TestRecipeSoftDeleteKeepsDiaryUsable(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("recipe: %d %s", status, raw)
	}
	var recipe dishes.Dish
	if err := json.Unmarshal(raw, &recipe); err != nil {
		t.Fatal(err)
	}
	path := fmt.Sprintf("/v1/dishes/%d", recipe.ID)
	input := fmt.Sprintf(`{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","dishId":%d,"day":"2026-10-18","meal":"lunch","portion":150}`, recipe.ID)
	status, original, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	var eating eatings.Eating
	if err := json.Unmarshal(original, &eating); err != nil {
		t.Fatal(err)
	}
	if status != 201 {
		t.Fatalf("eating: %d %s", status, original)
	}

	status, raw, _ = authRequest(t, server.URL, "DELETE", path, alice.Token, "")
	if status != 204 {
		t.Fatalf("delete: %d %s", status, raw)
	}
	for _, method := range []string{"GET", "PUT", "DELETE"} {
		body := ""
		if method == "PUT" {
			body = recipeUpdate
		}
		status, raw, _ = authRequest(t, server.URL, method, path, alice.Token, body)
		if status != 404 {
			t.Fatalf("deleted %s: %d %s", method, status, raw)
		}
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/dishes", alice.Token, "")
	var library dishes.Page
	if err := json.Unmarshal(raw, &library); err != nil {
		t.Fatal(err)
	}
	if status != 200 || len(library.Items) != 0 {
		t.Fatalf("deleted in library: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 201 || !bytes.Equal(raw, original) {
		t.Fatalf("historical replay: %d %s", status, raw)
	}
	input = strings.ReplaceAll(input, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
	if status != 404 {
		t.Fatalf("new eating from deleted recipe: %d %s", status, raw)
	}
	input = strings.Replace(recipeBody, `"dishId":1`, fmt.Sprintf(`"dishId":%d`, recipe.ID), 1)
	input = strings.ReplaceAll(input, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
	status, raw, _ = authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, input)
	if status != 404 {
		t.Fatalf("ingredient from deleted recipe: %d %s", status, raw)
	}

	status, raw, _ = authRequest(t, server.URL, "PATCH", fmt.Sprintf("/v1/eatings/%d", eating.ID), alice.Token, `{"portion":100}`)
	var corrected eatings.Eating
	if err := json.Unmarshal(raw, &corrected); err != nil {
		t.Fatal(err)
	}
	if status != 200 || !reflect.DeepEqual(corrected.DishSnapshot, eating.DishSnapshot) || !closeFoodValue(corrected.FoodValue, dishes.FoodValue{Proteins: 8.75, Fats: 4, Carbs: 17.5, Calories: 148.75}) {
		t.Fatalf("historical correction: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	var daily eatings.Daily
	if err := json.Unmarshal(raw, &daily); err != nil {
		t.Fatal(err)
	}
	if status != 200 || len(daily.Meals["lunch"].Eatings) != 1 || !reflect.DeepEqual(daily.Meals["lunch"].Eatings[0], corrected) {
		t.Fatalf("historical read: %d %s", status, raw)
	}
}

func TestRecipePutReplacesCompositionAndRollsBackFailures(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, original, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("create: %d %s", status, original)
	}
	var recipe dishes.Dish
	if err := json.Unmarshal(original, &recipe); err != nil {
		t.Fatal(err)
	}
	path := fmt.Sprintf("/v1/dishes/%d", recipe.ID)
	for _, tc := range []struct {
		body   string
		status int
	}{
		{strings.Replace(recipeUpdate, `"portion":300`, `"portion":0`, 1), 422},
		{strings.Replace(recipeUpdate, `"dishId":2`, `"dishId":4`, 1), 404},
		{strings.Replace(recipeUpdate, `"dishId":2`, `"dishId":99999`, 1), 404},
		{strings.Replace(recipeUpdate, `"dishId":2`, fmt.Sprintf(`"dishId":%d`, recipe.ID), 1), 422},
		{strings.Replace(recipeUpdate, `"dishId":2`, `"dishId":1`, 1), 422},
		{strings.Replace(recipeUpdate, `"name":"Новая версия"`, `"name":" "`, 1), 422},
		{strings.Replace(recipeUpdate, `"cookedWeight":250`, `"cookedWeight":0`, 1), 422},
		{strings.Replace(recipeUpdate, `"cookedWeight":250`, `"cookedWeight":1e-320`, 1), 422},
		{strings.Replace(recipeUpdate, `"defaultPortion":150`, `"defaultPortion":-1`, 1), 422},
		{strings.Replace(recipeUpdate, `"ingredients":[{"dishId":1,"portion":200},{"dishId":2,"portion":300}]`, `"ingredients":[]`, 1), 422},
		{strings.Replace(recipeUpdate, `"icon":"🥘",`, ``, 1), 400},
		{strings.Replace(recipeUpdate, `"name":"Новая версия"`, `"name":null`, 1), 400},
		{strings.Replace(recipeUpdate, `"dishId":1`, `"dishId":null`, 1), 400},
		{strings.Replace(recipeUpdate, `"portion":200`, `"portion":200,"calories":1`, 1), 400},
		{strings.Replace(recipeUpdate, `"icon":"🥘"`, `"icon":"🥘","spaceId":2`, 1), 400},
		{recipeBody, 400},
	} {
		status, raw, _ := authRequest(t, server.URL, "PUT", path, alice.Token, tc.body)
		if status != tc.status {
			t.Fatalf("invalid PUT: want %d got %d %s (%s)", tc.status, status, raw, tc.body)
		}
		status, raw, _ = authRequest(t, server.URL, "GET", path, alice.Token, "")
		if status != 200 || !bytes.Equal(raw, original) {
			t.Fatalf("failed PUT changed recipe: %d %s", status, raw)
		}
	}

	// Ошибка записи после UPDATE заголовка должна откатить его и удаление состава.
	admin := dishAdmin(t, dsn)
	if _, err := admin.Exec(context.Background(), `REVOKE INSERT ON app.ingredients FROM fatbook_user`); err != nil {
		t.Fatal(err)
	}
	status, raw, _ := authRequest(t, server.URL, "PUT", path, alice.Token, recipeUpdate)
	if status != 500 {
		t.Fatalf("failed insert: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", path, alice.Token, "")
	if status != 200 || !bytes.Equal(raw, original) {
		t.Fatalf("failed insert left changes: %d %s", status, raw)
	}
	if _, err := admin.Exec(context.Background(), `GRANT INSERT ON app.ingredients TO fatbook_user; UPDATE app.dishes SET name='Свежий источник',proteins=20,fats=5,carbs=10,calories=200 WHERE id=3`); err != nil {
		t.Fatal(err)
	}

	input := `{"name":"Замена","icon":null,"defaultPortion":null,"cookedWeight":250,"ingredients":[{"dishId":1,"portion":100},{"dishId":3,"portion":100}]}`
	status, raw, _ = authRequest(t, server.URL, "PUT", path, alice.Token, input)
	var updated dishes.Dish
	if err := json.Unmarshal(raw, &updated); err != nil {
		t.Fatal(err)
	}
	if status != 200 || updated.CookedWeight == nil || *updated.CookedWeight != 250 || len(updated.Ingredients) != 2 || updated.Ingredients[0].DishID != 1 || updated.Ingredients[0].Portion != 100 || updated.Ingredients[0].Calories != 170 || !reflect.DeepEqual(updated.Ingredients[0].SourceSnapshot, recipe.Ingredients[0].SourceSnapshot) || updated.Ingredients[1].DishID != 3 || updated.Ingredients[1].SourceSnapshot.Name != "Свежий источник" || !closeFoodValue(updated.FoodValue, dishes.FoodValue{Proteins: 12, Fats: 4, Carbs: 12, Calories: 148}) {
		t.Fatalf("replacement: %d %s", status, raw)
	}
}

func TestRecipeMutationsEnforceAccess(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, "", "bob@example.test", "bob secret")
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("create: %d %s", status, raw)
	}
	var recipe dishes.Dish
	if err := json.Unmarshal(raw, &recipe); err != nil {
		t.Fatal(err)
	}
	for _, method := range []string{"PUT", "DELETE"} {
		body := ""
		if method == "PUT" {
			body = recipeUpdate
		}
		for _, tc := range []struct {
			id     int64
			token  string
			status int
			code   string
		}{
			{1, alice.Token, 403, "read_only_resource"},
			{recipe.ID, bob.Token, 404, "not_found"},
			{999999, alice.Token, 404, "not_found"},
			{3, alice.Token, 422, "validation_failed"},
			{recipe.ID, "", 401, "unauthenticated"},
		} {
			status, raw, _ := authRequest(t, server.URL, method, fmt.Sprintf("/v1/dishes/%d", tc.id), tc.token, body)
			if status != tc.status || !strings.Contains(string(raw), `"code":"`+tc.code+`"`) {
				t.Fatalf("%s: %d %s", method, status, raw)
			}
		}
		status, raw, _ := authRequest(t, server.URL, method, fmt.Sprintf("/v1/dishes/%d?extra=1", recipe.ID), alice.Token, body)
		if status != 400 {
			t.Fatalf("query: %d %s", status, raw)
		}
	}
}

func TestConcurrentRecipePutAndEatingKeepOneVersion(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	status, raw, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("recipe: %d %s", status, raw)
	}
	var recipe dishes.Dish
	if err := json.Unmarshal(raw, &recipe); err != nil {
		t.Fatal(err)
	}
	path := fmt.Sprintf("/v1/dishes/%d", recipe.ID)
	before := strings.Replace(recipeBody, `"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",`, "", 1)
	after := strings.Replace(recipeUpdate, `"portion":200`, `"portion":300`, 1)
	start := make(chan struct{})
	var wg sync.WaitGroup
	wg.Go(func() {
		<-start
		for i := range 30 {
			body := before
			if i%2 == 0 {
				body = after
			}
			status, raw, _ := authRequest(t, server.URL, "PUT", path, alice.Token, body)
			if status != 200 {
				t.Errorf("PUT: %d %s", status, raw)
				return
			}
		}
	})
	wg.Go(func() {
		<-start
		for i := range 30 {
			input := fmt.Sprintf(`{"clientRequestId":"aaaaaaaa-aaaa-4aaa-8aaa-%012d","dishId":%d,"day":"2026-10-18","meal":"lunch","portion":150}`, i, recipe.ID)
			status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
			var eating eatings.Eating
			if err := json.Unmarshal(raw, &eating); err != nil {
				t.Error(err)
				return
			}
			old := eating.DishSnapshot.Name == "Рецепт A/B" && eating.DishSnapshot.Icon == nil && closeFoodValue(eating.DishSnapshot.FoodValue, dishes.FoodValue{Proteins: 8.75, Fats: 4, Carbs: 17.5, Calories: 148.75}) && closeFoodValue(eating.FoodValue, dishes.FoodValue{Proteins: 13.125, Fats: 6, Carbs: 26.25, Calories: 223.125})
			current := eating.DishSnapshot.Name == "Новая версия" && eating.DishSnapshot.Icon != nil && *eating.DishSnapshot.Icon == "🥘" && closeFoodValue(eating.DishSnapshot.FoodValue, dishes.FoodValue{Proteins: 18, Fats: 8.4, Carbs: 36, Calories: 306}) && closeFoodValue(eating.FoodValue, dishes.FoodValue{Proteins: 27, Fats: 12.6, Carbs: 54, Calories: 459})
			if status != 201 || (!old && !current) {
				t.Errorf("mixed eating: %d %s", status, raw)
				return
			}
		}
	})
	wg.Go(func() {
		<-start
		for range 30 {
			status, raw, _ := authRequest(t, server.URL, "GET", path, alice.Token, "")
			var loaded dishes.Dish
			if err := json.Unmarshal(raw, &loaded); err != nil {
				t.Error(err)
				return
			}
			if status != 200 || len(loaded.Ingredients) != 2 || loaded.CookedWeight == nil {
				t.Errorf("read: %d %s", status, raw)
				return
			}
			old := loaded.Name == "Рецепт A/B" && *loaded.CookedWeight == 400 && loaded.Ingredients[0].Portion == 200
			current := loaded.Name == "Новая версия" && *loaded.CookedWeight == 250 && loaded.Ingredients[0].Portion == 300
			if !old && !current {
				t.Errorf("mixed composition: %s", raw)
				return
			}
		}
	})
	close(start)
	wg.Wait()
}
