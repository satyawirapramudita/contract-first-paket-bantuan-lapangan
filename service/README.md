# Service README — Field Aid Package Distribution

## How to Run (from clean checkout)

```bash
cd service
cp .env.example .env
# Fill in DATABASE_URL and PORT in .env

psql $DATABASE_URL -f db/schema.sql
psql $DATABASE_URL -f db/seed.sql

npm install
npm start
```

The service refuses to start if `DATABASE_URL` or `PORT` are missing from the environment.

## Operation Status Table

| Operation | Method | Path | Served by | Status |
|---|---|---|---|---|
| Get single assistance request | GET | `/v1/assistance-requests/{requestId}` | service | ✅ Done |
| List assistance requests | GET | `/v1/assistance-requests` | service | ✅ Done |
| Create assistance request | POST | `/v1/assistance-requests` | service | ✅ Done |
| List packages | GET | `/v1/packages` | service | ✅ Done |
| List distributions | GET | `/v1/distributions` | service | ✅ Done |
| Confirm handover | POST | `/v1/handovers` | service | ✅ Done |

## Failure Catalogue

Every failure response uses `Content-Type: application/problem+json` and the five RFC 9457 fields.
The `problem()` function in `src/problem.js` is the single source for all failure shapes.

| Cause | Status | Type URI |
|---|---|---|
| `Idempotency-Key` header missing or malformed UUID v4 | 400 | `.../problems/invalid-request-payload` |
| Request body schema validation failed (wrong type, missing required field) | 400 | `.../problems/invalid-request-payload` |
| `requestId` path param does not match `req_XXXXX` pattern | 400 | `.../problems/invalid-request-payload` |
| Assistance request entity not found | 404 | `.../problems/resource-not-found` |
| Distribution entity not found | 404 | `.../problems/resource-not-found` |
| Handover already exists for this distribution (aid already dispensed) | 409 | `.../problems/aid-already-dispensed` |
| `Idempotency-Key` reused with different body | 409 | `.../problems/idempotency-key-reuse` |
| Distribution status does not allow handover (not `assigned` or `in_transit`) | 422 | `.../problems/invalid-state-transition` |
| Unexpected internal server failure | 500 | `.../problems/internal-server-error` |

## Directory Structure

```
service/
  .env.example          — every variable the service needs (commit; real .env is gitignored)
  db/
    schema.sql          — all CREATE TABLE statements (run from empty database)
    seed.sql            — small sample data for demonstration
  src/
    app.js              — assembly: routes, error handler, config validation
    problem.js          — one failure shape for the entire API (RFC 9457)
    routes/
      assistanceRequests.js   — GET list, GET by ID, POST
      packages.js             — GET list
      distributions.js        — GET list
      handovers.js            — POST handover
    schemas/
      assistanceRequests.js   — AJV validation rules from openapi.yaml
      handovers.js
    store/
      db.js                   — single pg Pool (only place that touches the database driver)
      assistanceRequests.js   — SQL for assistance_requests table
      packages.js
      distributions.js
      handovers.js
      idempotency.js          — idempotency_keys table (DB-backed, not in-memory)
    representations/
      assistanceRequests.js   — DB row → AssistanceRequest response shape
      packages.js
      distributions.js
      handovers.js
    middleware/
      idempotency.js          — enforces the four idempotency rules on POST routes
    utils/
      id.js                   — generates opaque IDs (req_XXXXX, pkg_XXXXX, etc.)
```

## Idempotency

`POST /v1/assistance-requests` and `POST /v1/handovers` require an `Idempotency-Key: <UUID v4>` header.

The four rules enforced server-side:

| Condition | Action | Status |
|---|---|---|
| Header missing or malformed | Reject before any work | 400 |
| Key never seen before | Record key + body hash, process, store response | 201 |
| Key seen, identical body | Return stored response (no reprocessing) | 201 (same ID) |
| Key seen, different body | Reject — key used for a different purpose | 409 |

Keys are stored in the `idempotency_keys` table (not in-process memory), so they survive service restarts.

## Contract Conformance Test

```bash
# Start mock server on port 4010
npx @stoplight/prism-cli mock ../openapi.yaml

# Start service on port 3000
npm start

# Run contract test
cd .. && bash tests/contract/contract.test.sh
```
