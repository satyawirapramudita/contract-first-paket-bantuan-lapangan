# Idempotency Policy

## Header Name and Format

The header is `Idempotency-Key`. Its value is a UUID version 4 in canonical hyphenated form.

## Required Operations

The header is required for:

- `POST /v1/assistance-requests`
- `POST /v1/distributions/{distributionId}/handover`

It is not required for safe GET operations.

## Key Generation and Offline Storage

The client generates the key when the user confirms the operation, not inside the network-send function. The mobile client stores the key together with the pending request and reuses the same key for every retry of the same intent.

## Retention Window

The server retains the key and the original response for 24 hours. Reuse after the retention window is treated as a new key.

## Reuse Behavior

- A new key is recorded and the request is processed.
- The same key with an identical body is not processed again; the stored response is returned with the same identifier.
- The same key with a different body returns `409 Conflict` with type `.../problems/idempotency-key-reuse`.
- If the original request is still processing, the server returns `409 Conflict` with `Retry-After`.
