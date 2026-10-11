#!/bin/sh
set -eu

commit=$(git rev-parse HEAD)
version=${RELEASE_VERSION:-dev}
case "$version" in
  *[!a-zA-Z0-9._-]*) echo 'Invalid RELEASE_VERSION' >&2; exit 1 ;;
esac
mkdir -p build
flags="-s -w -X github.com/sketchyy/fatbook/apps/api/internal/release.Version=$version -X github.com/sketchyy/fatbook/apps/api/internal/release.Commit=$commit"
CGO_ENABLED=0 go build -trimpath -buildvcs=false -ldflags "$flags" -o build/api ./cmd/api
CGO_ENABLED=0 go build -trimpath -buildvcs=false -ldflags "$flags" -o build/migrate ./cmd/migrate
