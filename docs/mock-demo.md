# Mock Server Demonstration

## Start the Mock Server

```bash
npx @stoplight/prism-cli mock openapi.yaml
```

Mock server berjalan di `http://127.0.0.1:4010`. Semua operasi `/v1/**` di kontrak
mendeklarasikan `oauth2`; Prism tidak memverifikasi token, tetapi contoh di bawah
tetap menyertakan header `Authorization` agar bentuk request sama dengan produksi.

## Request 1: List Assistance Requests

```bash
curl -i -H "Authorization: Bearer test-token" \
  "http://127.0.0.1:4010/v1/assistance-requests?status=approved&limit=20"
```

## Request 2: Get an Assistance Request

```bash
curl -i -H "Authorization: Bearer test-token" \
  "http://127.0.0.1:4010/v1/assistance-requests/req_7Kq91Ab"
```

## Request 3: Get a Distribution

```bash
curl -i -H "Authorization: Bearer test-token" \
  "http://127.0.0.1:4010/v1/distributions/dst_88bAa99"
```

## Request 4: Confirm a Handover

```bash
curl -i -X POST "http://127.0.0.1:4010/v1/handovers" \
  -H "Authorization: Bearer test-token" \
  -H "Idempotency-Key: 0f7c1b9e-3d21-4a6f-9c05-8e2b7d41a9f0" \
  -H "Content-Type: application/json" \
  -d '{"distributionId":"dst_88bAa99","recipientNationalId":"3578021203920003","handedOverAt":"2026-09-01T10:00:00+07:00","fieldOfficerId":"ofc_55xYz12"}'
```

## Missing Idempotency Key

```bash
curl -i -X POST "http://127.0.0.1:4010/v1/handovers" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"distributionId":"dst_88bAa99","recipientNationalId":"3578021203920003","handedOverAt":"2026-09-01T10:00:00+07:00","fieldOfficerId":"ofc_55xYz12"}'
```

Request terakhir harus ditolak karena `Idempotency-Key` wajib.

## Catatan Session 4

- Endpoint publik `GET /health` ada di luar prefix `/v1` (lihat `servers` pada path tersebut).
- `401` dan `403` pada kontrak memakai header `WWW-Authenticate`; mock server tidak
  mengembalikannya, service nyata yang mengembalikan.
- Untuk token asli, jalankan Keycloak lokal (lihat `infra/docker-compose.auth.yml`).
