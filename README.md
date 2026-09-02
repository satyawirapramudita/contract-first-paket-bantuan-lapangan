# Sistem Penyaluran Paket Bantuan Lapangan

## Anggota dan Role

| Anggota | NIM | Role | Tanggung jawab |
|---|---|---|---|
| Dhimas Putra Sulistio | 24/537952/PA/22811 | Contract Owner | Menyusun dan mereview `openapi.yaml` serta `CHANGELOG.md` |
| Indratanaya Budiman | 24/534784/PA/22683 | Service Owner | Menentukan domain, resource, dan aturan bisnis |
| Satya Wira Pramudita | 24/543649/PA/23102 | Client Owner | Menganalisis client, idempotency, dan compatibility |
| Aloysius Pijar Hutama Indrianto | 24/534591/PA/22675| Integration Owner | Menangani error catalog, mock server, README, dan demonstrasi |

## Scope

Sistem menangani proses dari pengajuan permintaan paket bantuan sampai konfirmasi paket diterima. Service belum diimplementasikan pada tugas ini.

## Repository Structure

```text
openapi.yaml
CHANGELOG.md
README.md
docs/
  decisions/
    0001-domain.md
  domain.md
  client-taxonomy.md
  resource-model.md
  business-rule.md
  idempotency.md
  error-catalog.md
  compatibility-policy.md
  mock-demo.md
service/
clients/
  web/
  mobile/
  device/
  mcp/
tests/
  contract/
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
