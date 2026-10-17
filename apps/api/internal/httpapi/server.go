package httpapi

import (
	"context"
	"crypto/rand"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

type Readiness interface {
	Ping(context.Context) error
}

type healthResponse struct {
	Status string `json:"status"`
}

func New(database Readiness, logger *slog.Logger) *echo.Echo {
	e := echo.New()
	e.Logger = logger
	e.HTTPErrorHandler = handleError
	e.JSONSerializer = jsonSerializer{}
	e.Binder = jsonBinder{}
	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			id := rand.Text()
			c.Request().Header.Set("X-Request-ID", id)
			c.Response().Header().Set("X-Request-ID", id)
			return next(c)
		}
	})
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		HandleError: true, LogLatency: true, LogMethod: true, LogRoutePath: true,
		LogRequestID: true, LogStatus: true,
		LogValuesFunc: func(c *echo.Context, values middleware.RequestLoggerValues) error {
			code := ""
			if values.Error != nil {
				_, detail := publicError(values.Error)
				code = detail.Code
			}
			logger.Log(c.Request().Context(), slog.LevelInfo, "http request",
				"request_id", values.RequestID, "method", values.Method,
				"route", values.RoutePath, "status", values.Status,
				"duration_ms", values.Latency.Milliseconds(), "error_code", code)
			return nil
		},
	}))
	e.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{DisablePrintStack: true}))
	e.Use(middleware.BodyLimit(1 << 20))
	health := e.Group("/health")
	health.GET("/live", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, healthResponse{Status: "ok"})
	})
	health.GET("/ready", func(c *echo.Context) error {
		if database == nil {
			return echo.ErrServiceUnavailable
		}
		if err := database.Ping(c.Request().Context()); err != nil {
			return echo.ErrServiceUnavailable
		}
		return c.JSON(http.StatusOK, healthResponse{Status: "ok"})
	})
	return e
}
