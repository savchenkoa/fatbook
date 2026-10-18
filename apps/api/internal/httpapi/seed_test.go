package httpapi_test

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"testing"

	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
	"github.com/sketchyy/fatbook/apps/api/internal/seed"
)

func TestDemoSeedFillsLibrariesWithoutReplacingUserRecipes(t *testing.T) {
	server, dsn := authServer(t, auth.DefaultOptions())
	admin := dishAdmin(t, dsn)
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	bob := login(t, server, "", "bob@example.test", "bob secret")

	status, original, _ := authRequest(t, server.URL, "POST", "/v1/dishes", alice.Token, recipeBody)
	if status != 201 {
		t.Fatalf("create user recipe: %d %s", status, original)
	}

	if err := seed.PrepareDemo(context.Background(), admin); err != nil {
		t.Fatal(err)
	}

	libraries := make(map[string][]byte)
	var aliceRecipeID int64
	for _, account := range []struct {
		token string
		count int
	}{
		{alice.Token, 4},
		{bob.Token, 3},
	} {
		status, body, _ := authRequest(t, server.URL, "GET", "/v1/dishes", account.token, "")
		var page dishes.Page
		if err := json.Unmarshal(body, &page); err != nil {
			t.Fatal(err)
		}
		if status != 200 || len(page.Items) != account.count {
			t.Fatalf("filled library: %d %s", status, body)
		}
		libraries[account.token] = body
		for _, summary := range page.Items {
			if summary.Name == "Рецепт A/B" {
				continue
			}
			status, body, _ := authRequest(t, server.URL, "GET", fmt.Sprintf("/v1/dishes/%d", summary.ID), account.token, "")
			var dish dishes.Dish
			if err := json.Unmarshal(body, &dish); err != nil {
				t.Fatal(err)
			}
			if status != 200 || len(dish.Ingredients) < 2 || dish.CookedWeight == nil || dish.DefaultPortion == nil || dish.Calories <= 0 {
				t.Fatalf("complete demo recipe: %d %s", status, body)
			}
			if dish.Name == "Овсянка с бананом" {
				aliceRecipeID = dish.ID
				// 60 г хлопьев + 200 г молока + 100 г банана, готовый вес 350 г.
				if math.Abs(dish.Proteins-4.257142857142857) > 1e-10 || math.Abs(dish.Fats-2.714285714285714) > 1e-10 || math.Abs(dish.Carbs-19.6) > 1e-10 || math.Abs(dish.Calories-118.57142857142857) > 1e-10 {
					t.Fatalf("oatmeal nutrients: %s", body)
				}
				if dish.Ingredients[0].SourceSnapshot.Name != "Овсяные хлопья" || dish.Ingredients[0].SourceSnapshot.Calories != 370 || dish.Ingredients[0].Calories != 222 {
					t.Fatalf("oatmeal snapshot: %s", body)
				}
			}
		}
	}
	if aliceRecipeID == 0 {
		t.Fatal("Alice's oatmeal recipe is missing")
	}

	status, _, _ = authRequest(t, server.URL, "GET", fmt.Sprintf("/v1/dishes/%d", aliceRecipeID), bob.Token, "")
	if status != 404 {
		t.Fatalf("Bob can read Alice's demo recipe: %d", status)
	}

	status, productsBefore, _ := authRequest(t, server.URL, "GET", "/v1/dishes?scope=ingredients", alice.Token, "")
	var products dishes.Page
	if err := json.Unmarshal(productsBefore, &products); err != nil {
		t.Fatal(err)
	}
	if status != 200 || len(products.Items) != 15 {
		t.Fatalf("demo catalog: %d %s", status, productsBefore)
	}

	if err := seed.PrepareDemo(context.Background(), admin); err != nil {
		t.Fatal(err)
	}
	for token, before := range libraries {
		status, after, _ := authRequest(t, server.URL, "GET", "/v1/dishes", token, "")
		if status != 200 || !reflect.DeepEqual(before, after) {
			t.Fatalf("repeated seed changed library: %d %s", status, after)
		}
	}
	status, productsAfter, _ := authRequest(t, server.URL, "GET", "/v1/dishes?scope=ingredients", alice.Token, "")
	if status != 200 || !reflect.DeepEqual(productsBefore, productsAfter) {
		t.Fatalf("repeated seed changed catalog: %d %s", status, productsAfter)
	}

	var userRecipe dishes.Dish
	if err := json.Unmarshal(original, &userRecipe); err != nil {
		t.Fatal(err)
	}
	status, after, _ := authRequest(t, server.URL, "GET", fmt.Sprintf("/v1/dishes/%d", userRecipe.ID), alice.Token, "")
	var restored dishes.Dish
	if err := json.Unmarshal(after, &restored); err != nil {
		t.Fatal(err)
	}
	if status != 200 || !reflect.DeepEqual(userRecipe, restored) {
		t.Fatalf("seed changed user recipe: %d %s", status, after)
	}
}
