package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/auth"
	"github.com/sketchyy/fatbook/apps/api/internal/dishes"
	"github.com/sketchyy/fatbook/apps/api/internal/eatings"
)

func RegisterEatings(e *echo.Echo, sessions *auth.Service, service *eatings.Service) {
	group := e.Group("/v1/eatings", func(next echo.HandlerFunc) echo.HandlerFunc {
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

			c.Set("eatingUser", state.User.ID)
			return next(c)
		}
	})

	group.GET("", func(c *echo.Context) error {
		params := c.QueryParams()
		if len(params) != 1 || len(params["day"]) != 1 {
			return echo.ErrBadRequest
		}
		day := params.Get("day")
		if !eatings.ValidDay(day) {
			return dishError(&dishes.ValidationError{Path: "day", Code: "invalid_day"})
		}

		result, err := service.Daily(c.Request().Context(), c.Get("eatingUser").(string), day)
		if err != nil {
			return dishError(err)
		}

		return c.JSON(http.StatusOK, result)
	})

	group.POST("", func(c *echo.Context) error {
		if len(c.QueryParams()) != 0 {
			return echo.ErrBadRequest
		}
		var input eatings.CreateInput
		if err := bindEating(c, &input, []string{"clientRequestId", "dishId", "day", "meal", "portion"}); err != nil {
			return err
		}
		if !requestUUID.MatchString(input.ClientRequestID) {
			return dishError(&dishes.ValidationError{Path: "clientRequestId", Code: "invalid_uuid"})
		}

		result, err := service.Create(c.Request().Context(), c.Get("eatingUser").(string), input)
		if err != nil {
			return dishError(err)
		}

		return c.JSON(http.StatusCreated, result)
	})

	group.PATCH("/:id", func(c *echo.Context) error {
		id, err := eatingID(c)
		if err != nil {
			return err
		}
		var input struct {
			Portion float64 `json:"portion"`
		}
		if err := bindEating(c, &input, []string{"portion"}); err != nil {
			return err
		}

		result, err := service.Update(c.Request().Context(), c.Get("eatingUser").(string), id, input.Portion)
		if err != nil {
			return dishError(err)
		}

		return c.JSON(http.StatusOK, result)
	})

	group.DELETE("/:id", func(c *echo.Context) error {
		id, err := eatingID(c)
		if err != nil {
			return err
		}
		if err := service.Delete(c.Request().Context(), c.Get("eatingUser").(string), id); err != nil {
			return dishError(err)
		}

		return c.NoContent(http.StatusNoContent)
	})
}

func bindEating(c *echo.Context, target interface{}, keys []string) error {
	var fields map[string]json.RawMessage
	if err := c.Bind(&fields); err != nil {
		return err
	}
	if len(fields) != len(keys) {
		return echo.ErrBadRequest
	}
	for _, key := range keys {
		raw, ok := fields[key]
		if !ok || bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
			return echo.ErrBadRequest
		}
	}

	raw, err := json.Marshal(fields)
	if err != nil {
		return echo.ErrBadRequest
	}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return echo.ErrBadRequest
	}

	return nil
}

func eatingID(c *echo.Context) (int64, error) {
	if len(c.QueryParams()) != 0 {
		return 0, echo.ErrBadRequest
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 || id > 9007199254740991 {
		return 0, echo.ErrBadRequest
	}

	return id, nil
}
