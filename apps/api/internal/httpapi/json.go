package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"mime"

	"github.com/labstack/echo/v5"
)

type jsonSerializer struct{ echo.DefaultJSONSerializer }

type jsonBinder struct{}

func (jsonBinder) Bind(c *echo.Context, target any) error {
	mediaType, _, err := mime.ParseMediaType(c.Request().Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		return echo.ErrUnsupportedMediaType
	}
	return c.Echo().JSONSerializer.Deserialize(c, target)
}

func invalidJSON(err error) error {
	if errors.Is(err, echo.ErrStatusRequestEntityTooLarge) {
		return echo.ErrStatusRequestEntityTooLarge
	}
	return echo.ErrBadRequest
}

func (jsonSerializer) Deserialize(c *echo.Context, target any) error {
	decoder := json.NewDecoder(c.Request().Body)
	var raw json.RawMessage
	if err := decoder.Decode(&raw); err != nil {
		return invalidJSON(err)
	}
	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 || trimmed[0] != '{' {
		return echo.ErrBadRequest
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return invalidJSON(err)
	}
	decoder = json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return echo.ErrBadRequest
	}
	return nil
}
