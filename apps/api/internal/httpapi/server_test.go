package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/database"
	"github.com/sketchyy/fatbook/apps/api/internal/httpapi"
	"github.com/sketchyy/fatbook/apps/api/internal/testdb"
)

func TestLivenessDoesNotRequireDatabase(t *testing.T) {
	server := httptest.NewServer(httpapi.New(nil, slog.New(slog.NewJSONHandler(io.Discard, nil))))
	defer server.Close()
	response, err := http.Get(server.URL + "/health/live")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("liveness status = %d, want 200", response.StatusCode)
	}
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if string(body) != "{\"status\":\"ok\"}\n" {
		t.Fatalf("liveness body = %s", body)
	}
	if response.Header.Get("X-Request-ID") == "" {
		t.Fatal("missing request ID")
	}
}

func TestReadinessFailureDoesNotBreakLiveness(t *testing.T) {
	dsn, _ := testdb.New(t)
	db, err := database.New(context.Background(), dsn, 1, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	var logs logBuffer
	server := httptest.NewServer(httpapi.New(db, slog.New(slog.NewJSONHandler(&logs, nil))))
	defer server.Close()
	response, err := http.Get(server.URL + "/health/ready")
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("ready status = %d, want 200", response.StatusCode)
	}
	db.Close()
	response, err = http.Get(server.URL + "/health/ready?password=secret-diary")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusServiceUnavailable {
		t.Fatalf("unavailable status = %d, want 503", response.StatusCode)
	}
	var body struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
		RequestID string `json:"requestId"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Error.Code != "service_unavailable" || body.Error.Message == "" || body.RequestID != response.Header.Get("X-Request-ID") {
		t.Fatalf("unexpected error: %+v", body)
	}
	response, err = http.Get(server.URL + "/health/live")
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("live status = %d, want 200", response.StatusCode)
	}
	logText := logs.String()
	if strings.Contains(logText, "secret-diary") {
		t.Fatal("request content leaked to logs")
	}
	if !strings.Contains(logText, `"route":"/health/ready"`) || !strings.Contains(logText, `"error_code":"service_unavailable"`) {
		t.Fatalf("missing safe request fields: %s", logText)
	}
}

type logBuffer struct {
	mu     sync.Mutex
	buffer bytes.Buffer
}

func (b *logBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buffer.Write(p)
}

func (b *logBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buffer.String()
}

func TestHTTPBoundaryRejectsInvalidDTOAndHidesInternalErrors(t *testing.T) {
	var logs logBuffer
	e := httpapi.New(nil, slog.New(slog.NewJSONHandler(&logs, nil)))
	// Тестовый маршрут упражняет общую HTTP-обвязку без добавления продуктового API.
	e.POST("/v1/test/:id", func(c *echo.Context) error {
		var dto struct {
			Name string `json:"name"`
		}
		if err := c.Bind(&dto); err != nil {
			return err
		}
		if dto.Name == "panic" {
			panic("private SQL secret-diary")
		}
		return c.JSON(http.StatusOK, dto)
	})
	server := httptest.NewServer(e)
	defer server.Close()
	tests := []struct {
		name, body string
		status     int
		code       string
	}{
		{"valid DTO", `{"name":"value"}`, 200, ""},
		{"JSON with charset", `{"name":"value"}`, 200, ""},
		{"XML", `<dto><Name>value</Name></dto>`, 415, "invalid_request"},
		{"form", `name=value`, 415, "invalid_request"},
		{"empty JSON", ``, 400, "invalid_request"},
		{"unknown owner", `{"name":"value","userId":"secret-diary"}`, 400, "invalid_request"},
		{"wrong type", `{"name":123}`, 400, "invalid_request"},
		{"malformed JSON", `{"name":`, 400, "invalid_request"},
		{"second object", `{"name":"one"}{"name":"two"}`, 400, "invalid_request"},
		{"null", `null`, 400, "invalid_request"},
		{"array", `[]`, 400, "invalid_request"},
		{"too large", `{"name":"` + strings.Repeat("x", 1<<20) + `"}`, 413, "invalid_request"},
		{"chunked too large", `{"name":"` + strings.Repeat("x", 1<<20) + `"}`, 413, "invalid_request"},
		{"panic", `{"name":"panic"}`, 500, "internal_error"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request, err := http.NewRequest(http.MethodPost, server.URL+"/v1/test/secret-diary?token=secret-token", strings.NewReader(test.body))
			if err != nil {
				t.Fatal(err)
			}
			request.Header.Set("Content-Type", "application/json")
			switch test.name {
			case "JSON with charset":
				request.Header.Set("Content-Type", "application/json; charset=utf-8")
			case "XML":
				request.Header.Set("Content-Type", "application/xml")
			case "form":
				request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			}
			if test.name == "chunked too large" {
				request.ContentLength = -1
			}
			request.Header.Set("Authorization", "Bearer secret-token")
			request.Header.Set("X-Request-ID", "secret-request-id")
			response, err := http.DefaultClient.Do(request)
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			body, err := io.ReadAll(response.Body)
			if err != nil {
				t.Fatal(err)
			}
			if response.StatusCode != test.status {
				t.Fatalf("status=%d body=%s", response.StatusCode, body)
			}
			if response.Header.Get("X-Request-ID") == "" || response.Header.Get("X-Request-ID") == "secret-request-id" {
				t.Fatal("request ID was not generated by server")
			}
			if test.code != "" {
				var result struct {
					Error struct {
						Code string `json:"code"`
					} `json:"error"`
					RequestID string `json:"requestId"`
				}
				if err := json.Unmarshal(body, &result); err != nil {
					t.Fatal(err)
				}
				if result.Error.Code != test.code || result.RequestID != response.Header.Get("X-Request-ID") {
					t.Fatalf("error=%s", body)
				}
				if bytes.Contains(body, []byte("secret")) {
					t.Fatal("internal content leaked to response")
				}
				if !strings.Contains(logs.String(), `"error_code":"`+test.code+`"`) {
					t.Fatal("missing safe error code in log")
				}
			}
		})
	}
	logText := logs.String()
	for _, secret := range []string{"secret-diary", "secret-token", "secret-request-id", "private SQL"} {
		if strings.Contains(logText, secret) {
			t.Fatalf("%s leaked to request log", secret)
		}
	}
	if !strings.Contains(logText, `"route":"/v1/test/:id"`) {
		t.Fatalf("missing safe log fields: %s", logText)
	}
}
