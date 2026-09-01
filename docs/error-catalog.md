# Error Catalog

All errors use `application/problem+json` and the Problem Details fields `type`, `title`, `status`, `detail`, and `instance`.

| Type | Status | Trigger | Extension members | Client action |
|---|---:|---|---|---|
| `/problems/request-not-eligible` | 422 | Request tidak memenuhi syarat | `failedCriteria` | Jangan retry; tampilkan alasan |
| `/problems/package-unavailable` | 409 | Paket tidak tersedia | `availableAt` | Jangan retry langsung; tampilkan pilihan menunggu |
| `/problems/already-distributed` | 409 | Request sudah disalurkan | `distributionId` | Ambil status terbaru |
| `/problems/idempotency-key-reuse` | 409 | Key yang sama digunakan dengan body berbeda | `originalRequestHash` | Jangan retry dengan key tersebut |
| `/problems/invalid-state-transition` | 409 | Transisi status tidak valid | `currentStatus` | Ambil resource terbaru |
| `/problems/unauthorized` | 401 | Kredensial tidak valid atau tidak ada | `authenticationScheme` | Minta autentikasi |
| `/problems/forbidden` | 403 | Role tidak memiliki izin | `requiredRole` | Jangan retry; minta tindakan pengguna |
| `/problems/not-found` | 404 | Resource tidak ditemukan | Tidak ada | Periksa identifier |
| `/problems/service-unavailable` | 503 | Service sementara tidak tersedia | `retryAfterSeconds` | Retry dengan exponential backoff |

## Example: Package Unavailable

```json
{
  "type": "https://api.example.com/problems/package-unavailable",
  "title": "Package is unavailable",
  "status": 409,
  "detail": "No package is currently available for this request.",
  "instance": "/v1/assistance-requests/req_7Kq91Ab",
  "requestId": "req_7Kq91Ab",
  "suggestedNextAction": "wait_for_stock"
}