# ADR 0002 — Implementation Decisions (Session 3)

Date: 2026-09-10

## Context

Tugas P3 (Session 3 Assignment: Contract Implementation) mengharuskan kelompok untuk:
1. Memilih hosting provider untuk deployment publik service.
2. Menentukan mekanisme penyimpanan idempotency key server-side.
3. Mendefinisikan struktur service directory yang memisahkan tanggung jawab per layer.

Kontrak OpenAPI yang dibuat di Session 2 menjadi satu-satunya referensi implementasi.
Perubahan pada `openapi.yaml` hanya diizinkan jika kontrak memang salah, bukan untuk membuat test pass.

## Decision

### 1. Hosting Provider: Render.com

Render.com dipilih sebagai platform deployment karena:
- Mendukung PostgreSQL managed database secara terintegrasi (tidak perlu provider DB terpisah).
- Deployment otomatis dari GitHub repository tanpa konfigurasi CI/CD yang kompleks.
- Free tier cukup untuk workload demonstrasi sesi lab.
- Start command (`npm start`) dapat dikonfigurasi langsung dari dashboard.

### 2. Idempotency Key Storage: PostgreSQL Table (`idempotency_keys`)

Idempotency key disimpan di tabel `idempotency_keys` di database PostgreSQL, **bukan** di in-process data structure (Map, object, dll).

Alasan spesifik: waktu ketika retry tiba adalah waktu ketika sesuatu sudah salah — yaitu momen paling mungkin proses baru saja restart. Menyimpan key di memory menghilangkan mekanisme proteksi tepat saat dibutuhkan.

Hash body (SHA-256) disimpan bersama key sehingga penggunaan ulang satu key dengan body berbeda dapat dideteksi dan ditolak dengan 409 `idempotency-key-reuse`.

### 3. Directory Structure

Mengikuti struktur A.1 dari Assignment Session 3 tanpa deviasi:
- `routes/` — binding method+path ke satu fungsi handler
- `schemas/` — validation rules turunan dari `openapi.yaml` (menggunakan AJV)
- `store/` — satu-satunya layer yang menjalankan SQL
- `representations/` — mapping DB row ke response shape contract
- `problem.js` — satu fungsi untuk semua failure response (RFC 9457)

### 4. Framework dan Dependency

- **Runtime:** Node.js dengan Express 5
- **Database driver:** `pg` (node-postgres)
- **Validation:** AJV 8 + `ajv-formats`
- **Environment:** `dotenv` untuk load `.env` file

## Alternatives Considered

| Alternatif | Alasan Ditolak |
|---|---|
| Fly.io | Memerlukan setup Dockerfile dan flyctl CLI; overhead lebih tinggi untuk workload demo |
| Railway.app | Mirip Render, tapi Render memiliki UI yang lebih sederhana untuk konfigurasi service |
| Redis untuk idempotency | Menambah satu dependency eksternal tanpa manfaat signifikan; PostgreSQL sudah tersedia |
| In-memory Map untuk idempotency | Ditolak eksplisit — tidak memenuhi persyaratan tugas; duplikasi terjadi saat restart |
| SQLite | Tidak cocok untuk environment cloud hosted; tidak mendukung concurrent connections dengan baik |

## Consequences

- Service dapat di-deploy ulang dari clean checkout dengan dua perintah: `psql $DATABASE_URL -f service/db/schema.sql` lalu `npm start`.
- Idempotency key bertahan melewati deployment baru selama database tidak di-wipe (siklus 24 jam sesuai `docs/idempotency.md`).
- `BASE_URL` environment variable harus diset ke URL Render agar field `type` dan `instance` di Problem Details mengarah ke URL yang benar.
- Semua `CREATE TABLE` ada di `service/db/schema.sql` sehingga siapapun dapat rebuild database dari empty state dengan satu perintah.
