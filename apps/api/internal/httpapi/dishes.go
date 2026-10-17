package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/labstack/echo/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
)

var requestUUID = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

func RegisterDishes(e *echo.Echo, sessions *auth.Service, service *dishes.Service) {
	group := e.Group("/v1/dishes", func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			c.Response().Header().Set("Cache-Control", "no-store")
			if _, err := url.ParseQuery(c.Request().URL.RawQuery); err != nil {
				return echo.ErrBadRequest
			}
			token, err := bearer(c)
			if err != nil {
				return err
			}
			state, err := sessions.Me(c.Request().Context(), token)
			if err != nil {
				return authError(c, sessions, err)
			}
			c.Set("dishUser", state.User.ID)
			return next(c)
		}
	})
	group.GET("", func(c *echo.Context) error {
		params := c.QueryParams()
		for key, values := range params {
			if (key != "scope" && key != "q" && key != "page") || len(values) != 1 {
				return echo.ErrBadRequest
			}
		}
		scope := "mine"
		if values, ok := params["scope"]; ok {
			scope = values[0]
		}
		if scope != "mine" && scope != "ingredients" {
			return dishError(&dishes.ValidationError{Path: "scope", Code: "invalid_scope"})
		}
		query := strings.TrimSpace(params.Get("q"))
		if utf8.RuneCountInString(query) > 100 {
			return dishError(&dishes.ValidationError{Path: "q", Code: "invalid_length"})
		}
		page := int64(1)
		if values, ok := params["page"]; ok {
			var err error
			page, err = strconv.ParseInt(values[0], 10, 64)
			if err != nil {
				return echo.ErrBadRequest
			}
			if page < 1 || page > 9007199254740991 {
				return dishError(&dishes.ValidationError{Path: "page", Code: "invalid_page"})
			}
		}
		result, err := service.List(c.Request().Context(), c.Get("dishUser").(string), scope, query, page)
		if err != nil {
			return dishError(err)
		}
		return c.JSON(http.StatusOK, result)
	})
	group.GET("/:id", func(c *echo.Context) error {
		if len(c.QueryParams()) != 0 {
			return echo.ErrBadRequest
		}
		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || id < 1 || id > 9007199254740991 {
			return echo.ErrBadRequest
		}
		dish, err := service.Get(c.Request().Context(), c.Get("dishUser").(string), id)
		if err != nil {
			return dishError(err)
		}
		return c.JSON(http.StatusOK, dish)
	})
	group.POST("", func(c *echo.Context) error {
		if len(c.QueryParams()) != 0 {
			return echo.ErrBadRequest
		}
		var fields map[string]json.RawMessage
		if err := c.Bind(&fields); err != nil {
			return err
		}
		if len(fields) != 6 {
			return echo.ErrBadRequest
		}
		for _, key := range []string{"clientRequestId", "name", "icon", "defaultPortion", "cookedWeight", "ingredients"} {
			// Nullable поля обязательны: отсутствие отличается от явного null.
			raw, ok := fields[key]
			if !ok {
				return echo.ErrBadRequest
			}
			if key != "icon" && key != "defaultPortion" && bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
				return echo.ErrBadRequest
			}
		}
		raw, _ := json.Marshal(fields)
		var input dishes.CreateInput
		decoder := json.NewDecoder(bytes.NewReader(raw))
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&input); err != nil {
			return echo.ErrBadRequest
		}
		var items []map[string]json.RawMessage
		if err := json.Unmarshal(fields["ingredients"], &items); err != nil {
			return echo.ErrBadRequest
		}
		for _, item := range items {
			if len(item) != 2 {
				return echo.ErrBadRequest
			}
			for _, key := range []string{"dishId", "portion"} {
				raw, ok := item[key]
				if !ok || bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
					return echo.ErrBadRequest
				}
			}
		}
		if !requestUUID.MatchString(input.ClientRequestID) {
			return dishError(&dishes.ValidationError{Path: "clientRequestId", Code: "invalid_uuid"})
		}
		dish, err := service.Create(c.Request().Context(), c.Get("dishUser").(string), input)
		if err != nil {
			return dishError(err)
		}
		return c.JSON(http.StatusCreated, dish)
	})
}

func dishError(err error) error {
	var validation *dishes.ValidationError
	switch {
	case errors.Is(err, dishes.ErrNotFound):
		return echo.ErrNotFound
	case errors.Is(err, dishes.ErrConflict):
		return &codedError{409, "idempotency_conflict", "Creation key already used with another request"}
	case errors.As(err, &validation):
		return &fieldValidationError{Field: fieldError{Path: validation.Path, Code: validation.Code, Message: "Invalid field value"}}
	default:
		return err
	}
}

type fieldError struct {
	Path    string `json:"path"`
	Code    string `json:"code"`
	Message string `json:"message"`
}
type fieldValidationError struct{ Field fieldError }

func (e *fieldValidationError) Error() string   { return "validation_failed" }
func (e *fieldValidationError) StatusCode() int { return 422 }
