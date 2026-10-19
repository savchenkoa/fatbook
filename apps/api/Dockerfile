FROM golang:1.27.2-alpine@sha256:f92b6ef800e499660581efdabdf25d9d817a9d124eaf900924f0504e7e27e12d AS build
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

FROM alpine:3.22.2@sha256:4b7ce07002c69e8f3d704a9c5d6fd3053be500b7f1c69fc0d80990c2ad8dd412
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
WORKDIR /app
COPY --from=build /out/api /out/migrate ./
USER 65532:65532
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD wget -q --spider "http://127.0.0.1:${PORT}/health/live" || exit 1
ENTRYPOINT ["/app/api"]
