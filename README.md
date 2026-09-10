# Sistem Penyaluran Paket Bantuan Lapangan

## Anggota dan Role

| Anggota | NIM | Role | Tanggung jawab |
|---|---|---|---|
| Dhimas Putra Sulistio | 24/537952/PA/22811 | Contract Owner | Menyusun dan mereview `openapi.yaml` serta `CHANGELOG.md` |
| Indratanaya Budiman | 24/534784/PA/22683 | Service Owner | Menentukan domain, resource, dan aturan bisnis |
| Satya Wira Pramudita | 24/543649/PA/23102 | Client Owner | Menganalisis client, idempotency, dan compatibility |
| Aloysius Pijar Hutama Indrianto | 24/534591/PA/22675| Integration Owner | Menangani error catalog, mock server, README, dan demonstrasi |

## Scope

Sistem menangani proses dari pengajuan permintaan paket bantuan sampai konfirmasi paket diterima di lapangan. Service diimplementasikan pada tugas P3 (Session 3) dan dapat diakses melalui deployment publik di bawah.

## Live Deployment

Service berjalan di: `https://<nama-app>.onrender.com`

> Ganti URL di atas dengan URL aktual dari Render.com setelah deploy selesai.

```bash
# Verify service is running
curl https://<nama-app>.onrender.com/health
# Expected: {"status":"ok"}
```

## Repository Structure

```text
openapi.yaml
CHANGELOG.md
README.md
render.yaml                  ← konfigurasi Render.com deployment
.github/
  workflows/
    ci.yml                   ← GitHub Actions contract conformance CI
docs/
  decisions/
    0001-domain.md
    0002-implementasi.md     ← ADR: hosting provider, idempotency storage
  domain.md
  client-taxonomy.md
  resource-model.md
  business-rule.md
  idempotency.md
  error-catalog.md
  compatibility-policy.md
  mock-demo.md
service/
  README.md                  ← operation table + failure catalogue
  .env.example               ← required env variables (commit; .env is gitignored)
  db/
    schema.sql               ← all CREATE TABLE (runnable from empty DB)
    seed.sql                 ← sample data for demonstration
  src/
    app.js
    problem.js
    routes/
    schemas/
    store/
    representations/
    middleware/
    utils/
clients/
  web/
  mobile/
  device/
  mcp/
tests/
  contract/
    contract.test.sh         ← contract conformance test script
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

Jalankan mock server sebelum menjalankan contoh request berikut.

## Curl Examples

### 1. List Assistance Requests

```bash
curl -i "http://127.0.0.1:4010/v1/assistance-requests?status=approved&limit=20"
```

### 2. Get an Assistance Request

```bash
curl -i "http://127.0.0.1:4010/v1/assistance-requests/req_7Kq91Ab"
```

### 3. Confirm a Handover

```bash
curl -i -X POST "http://127.0.0.1:4010/v1/distributions/dst_4Lm82Qp/handover" \
  -H "Idempotency-Key: 0f7c1b9e-3d21-4a6f-9c05-8e2b7d41a9f0" \
  -H "Content-Type: application/json" \
  -d '{"recipientName":"Example Recipient","receivedAt":"2026-09-01T10:00:00+07:00"}'
```

## Contribution Rule

Setiap anggota melakukan commit menggunakan identitas Git masing-masing. Implementasi service tidak boleh di-commit sebelum commit spesifikasi kontrak. Perubahan pada `openapi.yaml` harus direview oleh Contract Owner.


## Live Deployment

Service berjalan di: `https://paket-bantuan-lapangan.onrender.com`

```bash
curl https://paket-bantuan-lapangan.onrender.com/health