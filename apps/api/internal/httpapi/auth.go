package httpapi

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/sketchyy/fatbook/apps/api/internal/auth"
)

func RegisterAuth(e *echo.Echo, service *auth.Service) {
	group := e.Group("/v1/auth", func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			c.Response().Header().Set("Cache-Control", "no-store")

			if _, err := url.ParseQuery(c.Request().URL.RawQuery); err != nil {
				return echo.ErrBadRequest
			}
			if len(c.QueryParams()) != 0 {
				return echo.ErrBadRequest
			}

			return next(c)
		}
	})

	group.POST("/login", func(c *echo.Context) error {
		var dto struct {
			Email    *string `json:"email"`
			Password *string `json:"password"`
		}
		if err := c.Bind(&dto); err != nil {
			return err
		}
		if dto.Email == nil || dto.Password == nil {
			return echo.ErrBadRequest
		}
		if len(*dto.Email) > 254 || strings.TrimSpace(*dto.Email) == "" || len(*dto.Password) == 0 || len(*dto.Password) > 1024 {
			return echo.NewHTTPError(422, "Invalid field value")
		}

		token, err := bearer(c)
		if err != nil {
			return err
		}

		session, err := service.Login(c.Request().Context(), *dto.Email, *dto.Password, token)
		if err != nil {
			return authError(c, service, err)
		}

		return c.JSON(http.StatusOK, session)
	})

	group.GET("/me", func(c *echo.Context) error {
		token, err := bearer(c)
		if err != nil {
			return err
		}

		state, err := service.Me(c.Request().Context(), token)
		if err != nil {
			return authError(c, service, err)
		}

		return c.JSON(http.StatusOK, state)
	})

	group.POST("/logout", func(c *echo.Context) error {
		token, err := bearer(c)
		if err != nil {
			return err
		}

		if err := service.Logout(c.Request().Context(), token); err != nil {
			return authError(c, service, err)
		}

		return c.NoContent(http.StatusNoContent)
	})
}

func bearer(c *echo.Context) (string, error) {
	values := c.Request().Header.Values("Authorization")
	if len(values) == 0 {
		return "", nil
	}

	parts := strings.Fields(values[0])
	if len(values) != 1 || len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || len(parts[1]) > 256 {
		return "", echo.ErrUnauthorized
	}

	return parts[1], nil
}

func authError(c *echo.Context, service *auth.Service, err error) error {
	switch {
	case errors.Is(err, auth.ErrCredentials):
		return &codedError{401, "invalid_credentials", "Invalid email or password"}
	case errors.Is(err, auth.ErrUnauthenticated):
		return echo.ErrUnauthorized
	case errors.Is(err, auth.ErrLimited):
		c.Response().Header().Set("Retry-After", strconv.Itoa(service.RetryAfter()))
		return echo.NewHTTPError(429, "Try again later")
	case errors.Is(err, auth.ErrUnavailable):
		return echo.ErrServiceUnavailable
	default:
		return err
	}
}

type codedError struct {
	status        int
	code, message string
}

func (e *codedError) Error() string { return e.code }

func (e *codedError) StatusCode() int { return e.status }
