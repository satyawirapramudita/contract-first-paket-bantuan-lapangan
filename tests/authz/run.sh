#!/usr/bin/env bash
# Starts a test JWKS server and the service with test OIDC configuration,
# then runs the authz test suite. Requires DATABASE_URL (already migrated+seeded).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PORT:-3000}"
BASE="http://127.0.0.1:${PORT}"
JWKS_PORT="${TEST_JWKS_PORT:-9999}"

export OIDC_ISSUER="http://127.0.0.1:${JWKS_PORT}"
export OIDC_AUDIENCE="bantuan-lapangan-api"
export OIDC_JWKS_URI="http://127.0.0.1:${JWKS_PORT}/jwks.json"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required (export it first)"; exit 1
fi

mkdir -p "$ROOT/service/logs"
rm -f "$ROOT/service/logs/authz-jwks.log" "$ROOT/service/logs/authz-service.log"

node "$ROOT/tests/helpers/jwks-server.js" > "$ROOT/service/logs/authz-jwks.log" 2>&1 &
JWKS_PID=$!
SVC_PID=""
cleanup() {
  [ -n "$SVC_PID" ] && kill "$SVC_PID" 2>/dev/null || true
  kill "$JWKS_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 20); do
  curl -sf "http://127.0.0.1:${JWKS_PORT}/jwks.json" >/dev/null 2>&1 && break
  sleep 1
done

(cd "$ROOT/service" && DATABASE_URL="$DATABASE_URL" PORT="$PORT" BASE_URL="$BASE" NODE_ENV=test \
  node src/app.js > "$ROOT/service/logs/authz-service.log" 2>&1) &
SVC_PID=$!

for _ in $(seq 1 20); do
  curl -sf "$BASE/health" >/dev/null 2>&1 && break
  sleep 1
done

DATABASE_URL="$DATABASE_URL" BASE_URL="$BASE" node --test "$ROOT/tests/authz/"
