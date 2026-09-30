# Sistem Penyaluran Paket Bantuan Lapangan

## Anggota dan Role

| Anggota | NIM | Role | Tanggung jawab |
|---|---|---|---|
| Dhimas Putra Sulistio | 24/537952/PA/22811 | Contract Owner | Menyusun dan mereview `openapi.yaml` serta `CHANGELOG.md` |
| Indratanaya Budiman | 24/534784/PA/22683 | Service Owner | Menentukan domain, resource, dan aturan bisnis |
| Satya Wira Pramudita | 24/543649/PA/23102 | Client Owner | Menganalisis client, idempotency, dan compatibility |
| Aloysius Pijar Hutama Indrianto | 24/534591/PA/22675| Integration Owner | Menangani error catalog, mock server, README, dan demonstrasi |

## Scope

Sistem menangani proses dari pengajuan permintaan paket bantuan sampai konfirmasi
paket diterima di lapangan. Service diimplementasikan pada Session 3 dan diamankan
pada Session 4 dengan autentikasi (OAuth 2.0 / Keycloak) dan otorisasi tiga lapis.

## Live Deployment

Service API:

```bash
curl https://contract-first-paket-bantuan-lapangan-production.up.railway.app/health
# Expected: {"status":"ok"}
```

Authorisation server (Keycloak):

```text
https://<nama-keycloak>.up.railway.app/realms/bantuan-lapangan
```

> Ganti `<nama-keycloak>` dengan domain Railway hasil deploy
> (`infra/keycloak/Dockerfile`). Selama placeholder belum diganti, gunakan
> Keycloak lokal di `http://localhost:8080`.

Semua operasi `/v1/**` memerlukan `Authorization: Bearer <access token>` dengan
scope yang dideklarasikan pada operasi tersebut di `openapi.yaml`. Endpoint
`/health` bersifat publik.

## Session 5 & 6 — Web Application (Browser Client)

### 1. Deployed Application URL
- **Web Application Client**: `https://web-bantuan-lapangan.vercel.app` (atau Railway)
- **Backend API Service**: `https://contract-first-paket-bantuan-lapangan-production.up.railway.app`
- **Keycloak Auth Server**: `https://bantuan-auth.up.railway.app`

### 2. Akun Uji Demonstrasi (Session 7 Rehearsal Accounts)
| Username | Role | Scope Utama | Penggunaan Demo |
|---|---|---|---|
| `pemohon-a` | `pemohon` | `requests:read`, `requests:write` | Demo Workflow 1 (Pengajuan & pantau bantuan) & Uji Console Attack |
| `petugas-a` | `petugas-lapangan` | `requests:read`, `distributions:read`, `handovers:write` | Demo Workflow 2 (Handover & uji konflik 412 di dua jendela) |

*Password seluruh akun demo:* `LabOnly2026!`

### 3. Catatan Penyimpanan Sesi (Session Storage Decision - A.3 item 5)
Aplikasi menyimpan *access token* secara eksklusif di dalam **in-memory React state** selama runtime aplikasi berjalan dan **tidak pernah menyimpannya di `localStorage` atau `sessionStorage`**. Pilihan ini diambil untuk mengeliminasi risiko pencurian token melalui celah *Cross-Site Scripting* (XSS) di mana seluruh skrip pihak ketiga pada browser dapat membaca `localStorage`. Konsekuensi keamanan dari keputusan ini adalah saat halaman direfresh secara keras (*hard reload*), aplikasi akan meminta autentikasi ulang atau memanfaatkan *silent refresh* OAuth 2.0 PKCE.

### 4. Tabel Alur Kerja Pengguna (A.1 Workflow Scope)
Lihat tabel lengkap di `docs/workflow-scope.md`.

## Repository Structure

```text
openapi.yaml
CHANGELOG.md
README.md
infra/
  docker-compose.auth.yml       ← Keycloak lokal (Keycloak 26)
  .env.example                  ← KC_ADMIN_PASSWORD (commit; .env gitignored)
  keycloak/
    Dockerfile                  ← image Keycloak untuk Railway
    realm-bantuan-lapangan.json ← realm, 6 scope, client, 6 test user
.github/
  workflows/
    ci.yml                      ← contract + authz CI (Postgres, JWKS test)
docs/
  decisions/
    0001-domain.md
    0002-implementasi.md
    0003-autentikasi.md         ← ADR Session 4 (auth server, scope, rotation)
  domain.md
  client-taxonomy.md
  resource-model.md
  business-rule.md
  idempotency.md
  error-catalog.md
  compatibility-policy.md
  mock-demo.md
  session-4-checklist.md        ← checklist demo + bukti red/green
  session-5-checklist.md        ← checklist verifikasi session 5 & 6
  workflow-scope.md             ← pemetaan alur kerja pengguna A.1
service/
  README.md                     ← operation table, scope, ownership, failure catalogue
  .env.example
  db/
    schema.sql
    seed.sql
  src/
    config.js
    logger.js
    app.js
    problem.js
    auth/
    routes/
    schemas/
    store/
    representations/
    middleware/
    utils/
clients/
  web/
    vercel.json
  mobile/
  device/
  mcp/
tests/
  contract/
    contract.test.sh
  authz/
    authz.test.js
    run.sh
  service/
    conditional.test.js
  browser/
    console-attack.md
  helpers/
    jwks-server.js
    token.js
```

## Validate the OpenAPI Document

```bash
npx redocly lint openapi.yaml
```

Target validasi adalah tidak ada error.

## Preview the Documentation

```bash
npx redocly preview-docs openapi.yaml
```

## Run the Mock Server

```bash
npx @stoplight/prism-cli mock openapi.yaml
```

## Run Keycloak Locally

```bash
cd infra
cp .env.example .env    # isi KC_ADMIN_PASSWORD
docker compose -f docker-compose.auth.yml up -d
```

Realm `bantuan-lapangan` otomatis di-import: 6 scope, client `web-posko` dan
`mobile-petugas` (public, PKCE), `job-rekonsiliasi` (confidential), serta enam
test user (`LabOnly2026!`, lab-only).

## Curl Examples

### 0. Get a token (test-cli, development realm only)

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/bantuan-lapangan/protocol/openid-connect/token" \
  -d grant_type=password -d client_id=test-cli \
  -d username=pemohon-a -d password='LabOnly2026!' \
  -d scope='requests:read requests:write' | jq -r .access_token)
```

### 1. List Assistance Requests

```bash
curl -i -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/v1/assistance-requests?status=approved&limit=20"
```

### 2. Get an Assistance Request

```bash
curl -i -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/v1/assistance-requests/req_7Kq91Ab"
```

### 3. Confirm a Handover (petugas-a)

```bash
TOKEN_PETUGAS=$(curl -s -X POST "http://localhost:8080/realms/bantuan-lapangan/protocol/openid-connect/token" \
  -d grant_type=password -d client_id=test-cli \
  -d username=petugas-a -d password='LabOnly2026!' \
  -d scope='requests:read distributions:read handovers:write' | jq -r .access_token)

curl -i -X POST "http://localhost:3000/v1/handovers" \
  -H "Authorization: Bearer $TOKEN_PETUGAS" \
  -H "Idempotency-Key: 0f7c1b9e-3d21-4a6f-9c05-8e2b7d41a9f0" \
  -H "Content-Type: application/json" \
  -d '{"distributionId":"dst_88bAa99","recipientNationalId":"3578021203920003","handedOverAt":"2026-09-01T10:00:00+07:00","fieldOfficerId":"ofc_55xYz12"}'
```

## Contract and Authorisation Tests

```bash
export DATABASE_URL=postgresql://...
bash tests/authz/run.sh            # 4 uji negatif + Layer 1
```

Contract test ber-token dijalankan dengan JWKS test (lihat `service/README.md`).

## Contribution Rule

Setiap anggota melakukan commit menggunakan identitas Git masing-masing.
Implementasi service tidak boleh di-commit sebelum commit spesifikasi kontrak.
Perubahan pada `openapi.yaml` harus direview oleh Contract Owner.
