package httpapi_test

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"testing"

	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/eatings"
)

func TestEatingRejectsOverflowingDayAtomically(t *testing.T) {
	server, _ := authServer(t, auth.DefaultOptions())
	alice := login(t, server, "", "alice@example.test", "  alice secret  ")
	post := func(key, meal string, portion float64, want int) []byte {
		t.Helper()

		input := fmt.Sprintf(`{"clientRequestId":"%s","dishId":1,"day":"2026-10-18","meal":"%s","portion":%g}`, key, meal, portion)
		status, raw, _ := authRequest(t, server.URL, "POST", "/v1/eatings", alice.Token, input)
		if status != want {
			t.Fatalf("POST: status=%d want=%d: %s", status, want, raw)
		}

		return raw
	}
	post("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "breakfast", 1e308, 201)
	for _, meal := range []string{"breakfast", "lunch"} {
		post("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", meal, 1e308, 422)
	}
	var small eatings.Eating
	if err := json.Unmarshal(post("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "lunch", 100, 201), &small); err != nil {
		t.Fatal(err)
	}
	status, raw, _ := authRequest(t, server.URL, "PATCH", fmt.Sprintf("/v1/eatings/%d", small.ID), alice.Token, `{"portion":1e308}`)
	if status != 422 {
		t.Fatalf("PATCH: %d %s", status, raw)
	}
	status, raw, _ = authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
	var daily eatings.Daily
	if err := json.Unmarshal(raw, &daily); err != nil {
		t.Fatal(err)
	}
	if status != 200 || len(daily.Meals["breakfast"].Eatings) != 1 || len(daily.Meals["lunch"].Eatings) != 1 || daily.Meals["lunch"].Eatings[0].Portion != 100 {
		t.Fatalf("overflow changed the confirmed diary: %d %s", status, raw)
	}
}

func TestConcurrentEatingsCannotOverflowDay(t *testing.T) {
	for _, methods := range [][2]string{{"POST", "POST"}, {"PATCH", "PATCH"}, {"POST", "PATCH"}} {
		t.Run(methods[0]+"_"+methods[1], func(t *testing.T) {
			server, _ := authServer(t, auth.DefaultOptions())
			alice := login(t, server, "", "alice@example.test", "  alice secret  ")
			var wg sync.WaitGroup
			results := make(chan int, 2)
			start := make(chan struct{})
			for i, key := range []string{"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"} {
				method, path := methods[i], "/v1/eatings"
				body := fmt.Sprintf(`{"clientRequestId":"%s","dishId":1,"day":"2026-10-18","meal":"lunch","portion":1e308}`, key)
				if method == "PATCH" {
					status, raw, _ := authRequest(t, server.URL, "POST", path, alice.Token, strings.Replace(body, "1e308", "100", 1))
					var small eatings.Eating
					if err := json.Unmarshal(raw, &small); err != nil || status != 201 {
						t.Fatalf("prepare PATCH: %d %s: %v", status, raw, err)
					}
					path, body = fmt.Sprintf("/v1/eatings/%d", small.ID), `{"portion":1e308}`
				}
				wg.Go(func() {
					<-start
					status, _, _ := authRequest(t, server.URL, method, path, alice.Token, body)
					results <- status
				})
			}
			close(start)
			wg.Wait()
			accepted, rejected := 0, 0
			for range 2 {
				switch status := <-results; status {
				case 200, 201:
					accepted++
				case 422:
					rejected++
				default:
					t.Fatalf("unexpected concurrent status: %d", status)
				}
			}
			if accepted != 1 || rejected != 1 {
				t.Fatalf("concurrent writes: accepted=%d rejected=%d, want one each", accepted, rejected)
			}
			status, raw, _ := authRequest(t, server.URL, "GET", "/v1/eatings?day=2026-10-18", alice.Token, "")
			var daily eatings.Daily
			if err := json.Unmarshal(raw, &daily); err != nil || status != 200 {
				t.Fatalf("concurrent overflow corrupted diary: %d %s: %v", status, raw, err)
			}
			large := 0
			for _, eating := range daily.Meals["lunch"].Eatings {
				if eating.Portion == 1e308 {
					large++
				} else if eating.Portion != 100 {
					t.Fatal("failed request changed portion")
				}
			}
			if large != 1 {
				t.Fatal("day must contain exactly one large portion")
			}
		})
	}
}
