
# Mock Server Demonstration

## Start the Mock Server

```bash
npx @stoplight/prism-cli mock openapi.yaml
```

## Request 1: List Assistance Requests

```bash
curl -i "http://127.0.0.1:4010/v1/assistance-requests?status=approved&limit=20"
```

## Request 2: Get an Assistance Request

```bash
curl -i "http://127.0.0.1:4010/v1/assistance-requests/req_7Kq91Ab"
```

## Request 3: Confirm a Handover

```bash
curl -i -X POST "http://127.0.0.1:4010/v1/distributions/dst_4Lm82Qp/handover" \
  -H "Idempotency-Key: 0f7c1b9e-3d21-4a6f-9c05-8e2b7d41a9f0" \
  -H "Content-Type: application/json" \
  -d '{"recipientName":"Example Recipient","receivedAt":"2026-09-01T10:00:00+07:00"}'
```

## Missing Idempotency Key

```bash
curl -i -X POST "http://127.0.0.1:4010/v1/distributions/dst_4Lm82Qp/handover" \
  -H "Content-Type: application/json" \
  -d '{"recipientName":"Example Recipient","receivedAt":"2026-09-01T10:00:00+07:00"}'
```

The last request must be rejected because `Idempotency-Key` is required.