package httpapi

import (
	"context"
	"errors"
	"net"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/labstack/echo/v5"
)

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorResponse struct {
	Error     errorDetail `json:"error"`
	RequestID string      `json:"requestId"`
}

func publicError(err error) (int, errorDetail) {
	status := http.StatusInternalServerError
	var httpError echo.HTTPStatusCoder
	var pgError *pgconn.PgError
	var networkError net.Error
	switch {
	case errors.As(err, &httpError):
		status = httpError.StatusCode()
	case errors.Is(err, context.DeadlineExceeded), errors.As(err, &networkError):
		status = http.StatusServiceUnavailable
	case errors.As(err, &pgError):
		if strings.HasPrefix(pgError.Code, "08") || strings.HasPrefix(pgError.Code, "53") || pgError.Code == "57014" || pgError.Code == "57P01" || pgError.Code == "57P02" || pgError.Code == "57P03" {
			status = http.StatusServiceUnavailable
		}
	}
	detail := errorDetail{Code: "internal_error", Message: "Internal server error"}
	switch status {
	case http.StatusBadRequest, http.StatusMethodNotAllowed, http.StatusRequestEntityTooLarge, http.StatusUnsupportedMediaType:
		detail = errorDetail{Code: "invalid_request", Message: "Invalid request"}
	case http.StatusNotFound:
		detail = errorDetail{Code: "not_found", Message: "Resource not found"}
	case http.StatusServiceUnavailable:
		detail = errorDetail{Code: "service_unavailable", Message: "Service temporarily unavailable"}
	default:
		status = http.StatusInternalServerError
	}
	return status, detail
}

func handleError(c *echo.Context, err error) {
	if response, _ := echo.UnwrapResponse(c.Response()); response != nil && response.Committed {
		return
	}
	status, detail := publicError(err)
	c.Response().Header().Set("Cache-Control", "no-store")
	_ = c.JSON(status, errorResponse{Error: detail, RequestID: c.Response().Header().Get("X-Request-ID")})
}
