FROM golang:1.27.3-alpine@sha256:d200d2dd76b03a99b52651fd1325aff7dcd35422c35c01bac56571b0507f3deb AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY cmd ./cmd
COPY internal ./internal
COPY migrations ./migrations
ARG RELEASE_VERSION=dev
ARG RELEASE_COMMIT=unknown
RUN CGO_ENABLED=0 go build -trimpath -buildvcs=false -ldflags "-s -w -X github.com/sketchyy/fatbook/apps/api/internal/release.Version=${RELEASE_VERSION} -X github.com/sketchyy/fatbook/apps/api/internal/release.Commit=${RELEASE_COMMIT}" -o /out/api ./cmd/api
RUN CGO_ENABLED=0 go build -trimpath -buildvcs=false -ldflags "-s -w -X github.com/sketchyy/fatbook/apps/api/internal/release.Version=${RELEASE_VERSION} -X github.com/sketchyy/fatbook/apps/api/internal/release.Commit=${RELEASE_COMMIT}" -o /out/migrate ./cmd/migrate

FROM alpine:3.24.2@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
WORKDIR /app
COPY --from=build /out/api /out/migrate ./
USER 65532:65532
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD wget -q --spider "http://127.0.0.1:${PORT}/health/live" || exit 1
ENTRYPOINT ["/app/api"]
