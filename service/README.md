# Service README — Field Aid Package Distribution

## How to Run (from clean checkout)

```bash
cd service
cp .env.example .env
# Isi DATABASE_URL, PORT, BASE_URL, dan tiga variabel OIDC di .env

psql $DATABASE_URL -f db/schema.sql
psql $DATABASE_URL -f db/seed.sql

npm install
npm start
```

Service menolak start bila `DATABASE_URL`, `PORT`, `OIDC_ISSUER`, `OIDC_JWKS_URI`,
atau `OIDC_AUDIENCE` kosong. Variabel `OIDC_*` mengarah ke Keycloak
(`infra/docker-compose.auth.yml` untuk lokal).

## Operation Status Table

| Operation | Method | Path | Scope | Status |
|---|---|---|---|---|
| Get single assistance request | GET | `/v1/assistance-requests/{requestId}` | `requests:read` | ✅ Done |
| List assistance requests | GET | `/v1/assistance-requests` | `requests:read` | ✅ Done |
| Create assistance request | POST | `/v1/assistance-requests` | `requests:write` | ✅ Done |
| List packages | GET | `/v1/packages` | `packages:read` | ✅ Done |
| List distributions | GET | `/v1/distributions` | `distributions:read` | ✅ Done |
| Get single distribution | GET | `/v1/distributions/{distributionId}` | `distributions:read` | ✅ Done |
| Confirm handover | POST | `/v1/handovers` | `handovers:write` | ✅ Done |
| Health check | GET | `/health` (di luar `/v1`) | publik | ✅ Done |

## Scope Vocabulary

Access token wajib membawa scope yang dideklarasikan pada operasi terkait.
String scope di bawah harus sama persis dengan yang ada di `openapi.yaml`,
realm Keycloak, dan argumen `requireScope()` di routes.

| Scope | Mengizinkan | Pemohon | Koordinator | Petugas Gudang | Petugas Lapangan | Job |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `requests:read` | Melihat permohonan yang terlihat oleh pemanggil | milik sendiri | semua | — | yang ditugaskan | — |
| `requests:write` | Mengajukan permohonan milik sendiri | ya | — | — | — | — |
| `requests:review` | Meninjau dan menyetujui/menolak permohonan | — | ya | — | — | — |
| `packages:read` | Melihat inventaris paket gudang | — | ya | ya | ya | — |
| `distributions:read` | Melihat alokasi distribusi | — | semua | — | milik sendiri | semua |
| `handovers:write` | Mengonfirmasi serah terima | — | — | — | milik sendiri | — |

## Ownership Inventory (Layer 3)

| Operation | Object | Ownership rule |
| :--- | :--- | :--- |
| `GET /v1/assistance-requests/{requestId}` | assistance request | `applicant_subject` = subject pemanggil, ATAU pemanggil punya `requests:review`, ATAU petugas punya distribusi untuk request tersebut |
| `POST /v1/assistance-requests` | (objek baru) | Baris baru diberi `applicant_subject` = subject pemanggil |
| `GET /v1/assistance-requests` | collection | Dibatasi di dalam SQL: reviewer/service melihat semua; pemohon melihat miliknya; petugas lapangan melihat yang ditugaskan kepadanya |
| `GET /v1/packages` | collection | Inventaris bersama; dijaga oleh scope `packages:read`, tanpa ownership per baris |
| `GET /v1/distributions` | collection | Dibatasi di dalam SQL: reviewer/service melihat semua; petugas lapangan melihat miliknya |
| `GET /v1/distributions/{distributionId}` | distribution | `field_officer_subject` = subject pemanggil, ATAU `requests:review`, ATAU service |
| `POST /v1/handovers` | distribution | `field_officer_subject` = subject pemanggil. Dicek SEBELUM perubahan apa pun disimpan |

"Tidak ada" dan "bukan miliknya" menghasilkan respons `404` yang identik
(status, tipe, body) — `instance` memakai pola route agar tidak membocorkan ID.

## Failure Catalogue

Every failure response uses `Content-Type: application/problem+json` and the five
RFC 9457 fields. `problem()` in `src/problem.js` is the single source for all
failure shapes.

| Cause | Status | Type URI |
|---|---|---|
| Token tidak ada / tidak dapat diverifikasi / kedaluwarsa | 401 | `.../problems/unauthenticated` |
| Token valid tetapi scope operasi tidak dimiliki | 403 | `.../problems/insufficient-scope` |
| `Idempotency-Key` header missing or malformed UUID v4 | 400 | `.../problems/invalid-request-payload` |
| Request body schema validation failed | 400 | `.../problems/invalid-request-payload` |
| `requestId` / `distributionId` path param tidak sesuai pola | 400 | `.../problems/invalid-request-payload` |
| Assistance request entity not found (atau bukan milik pemanggil) | 404 | `.../problems/resource-not-found` |
| Distribution entity not found (atau bukan tugas petugas) | 404 | `.../problems/resource-not-found` |
| Handover already exists for this distribution | 409 | `.../problems/aid-already-dispensed` |
| `Idempotency-Key` reused with different body | 409 | `.../problems/idempotency-key-reuse` |
| Distribution status does not allow handover | 422 | `.../problems/invalid-state-transition` |
| Unexpected internal server failure | 500 | `.../problems/internal-server-error` |

## Idempotency

`POST /v1/assistance-requests` dan `POST /v1/handovers` memerlukan header
`Idempotency-Key: <UUID v4>`. Empat aturan yang ditegakkan server-side:

| Condition | Action | Status |
|---|---|---|
| Header missing or malformed | Reject before any work | 400 |
| Key never seen before | Record key + body hash, process, store response | 201 |
| Key seen, identical body | Return stored response (no reprocessing) | 201 (same ID) |
| Key seen, different body | Reject — key used for a different purpose | 409 |

Keys disimpan di tabel `idempotency_keys`, sehingga bertahan melewati restart.

## Directory Structure

```
service/
  .env.example          — every variable the service needs (commit; real .env is gitignored)
  db/
    schema.sql          — all CREATE TABLE statements (run from empty database)
    seed.sql            — sample data (subjects: pemohon-a/b/c, petugas-a/b)
  src/
    config.js           — env loading + startup validation (incl. OIDC)
    logger.js           — pino logger with authorization redaction
    app.js              — assembly: auth mount, routes, error handler
    problem.js          — one failure shape for the entire API (RFC 9457)
    auth/
      verify.js         — signature/iss/aud/exp verification via JWKS (jose)
      principal.js      — claims → { subject, kind, scopes, tokenId }
      authenticate.js   — Layer 1 middleware
      require-scope.js  — Layer 2 middleware
      ownership.js      — Layer 3 ownership predicates
    routes/
      assistanceRequests.js
      packages.js
      distributions.js
      handovers.js
    schemas/
      assistanceRequests.js
      handovers.js
    store/
      db.js
      assistanceRequests.js
      packages.js
      distributions.js
      handovers.js
      idempotency.js
    representations/
      assistanceRequests.js
      packages.js
      distributions.js
      handovers.js
    middleware/
      idempotency.js
    utils/
      id.js
```

## Tests

```bash
# Authz suite: starts its own JWKS server + service, needs DATABASE_URL
export DATABASE_URL=postgresql://...
bash tests/authz/run.sh

# Contract suite (Session 3, now tokenized):
node tests/helpers/jwks-server.js &
# start service with OIDC_* pointing at http://127.0.0.1:9999
BASE_URL=http://localhost:3000 bash tests/contract/contract.test.sh
```

Empat uji negatif menutup empat boundary: pemohon↔pemohon (read), petugas↔petugas
(write), pemohon vs operasi staff (scope), petugas↔petugas (read via endpoint baru).
Bukti red/green ada di `docs/session-4-checklist.md`.

## Log Hygiene

`logger.js` meredaksi `authorization`, `cookie`, dan `set-cookie`. Global error
handler hanya mencatat method, path, dan message — tidak pernah header. Bukti
grep: `docs/session-4-checklist.md`.
