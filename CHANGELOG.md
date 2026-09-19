# Contract Changelog

All notable changes to the API contract of the Field Aid Distribution System will be documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning and URI-path versioning (/v1/).

## [1.1.0] - 2026-09-19
### Changed - BREAKING
- Seluruh operasi `/v1/**` kini memerlukan OAuth 2.0 access token dengan scope yang
  dideklarasikan pada operasi tersebut. Request tanpa token valid dijawab `401`;
  token valid tanpa scope yang dibutuhkan dijawab `403`.
- Alasan: Session 3 sengaja belum memiliki autentikasi. Data pengguna tidak boleh
  dilayani tanpa memeriksa pemanggilnya.

### Added
- `components.securitySchemes.oauth2` dengan enam scope: `requests:read`,
  `requests:write`, `requests:review`, `packages:read`, `distributions:read`,
  `handovers:write`.
- Shared response `401 Unauthorized` dan `403 Forbidden` pada setiap operasi
  terproteksi, termasuk header `WWW-Authenticate`.
- Operasi `GET /v1/distributions/{distributionId}` untuk membaca satu distribusi
  (compatible addition).
- Endpoint publik `GET /health` didokumentasikan pada kontrak dengan `security: []`.

### Changed
- Deskripsi `404 Not Found` menegaskan bahwa "tidak ada" dan "bukan milik pemanggil"
  dijawab identik agar identifier tidak dapat dienumerasi.

## [0.1.0] - 2026-09-01
### Added
- Initial OpenAPI 3.1.0 specification for Field Aid Distribution System (`openapi.yaml`).
- Core resource schemas: `AssistanceRequest`, `Package`, `Distribution`, and `Handover`.
- RFC 9457 Problem Details schema (`application/problem+json`) with domain extension members (`requestId`, `currentStatus`, `suggestedNextAction`).
- Reusable error responses (`400 BadRequest`, `404 NotFound`, `409 Conflict`, `422 UnprocessableEntity`, `500 ServerError`).
- Endpoint `GET /v1/assistance-requests` with pagination (`cursor`, `limit`) and status/urgency filtering.
- Endpoint `POST /v1/assistance-requests` with mandatory `Idempotency-Key` header.
- Endpoint `POST /v1/handovers` for consequential offline-tolerant field handover confirmation with mandatory `Idempotency-Key`.
- Explicit closed string enums for request and package lifecycle states with client fallback handling rules.