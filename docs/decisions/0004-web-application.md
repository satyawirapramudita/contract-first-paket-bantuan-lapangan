# ADR 0004 — Web Application Architecture and Session Storage (Session 5)

Date: 2026-09-30
Status: Accepted

## Context
Tugas Session 5 mewajibkan pembuatan antarmuka web SPA yang berkomunikasi dengan REST API (Session 3) dan Keycloak OAuth 2.0 (Session 4).

## Decision
1. **Penyimpanan Sesi (Session Storage)**:
   - Access token disimpan **hanya di dalam memori runtime JavaScript (React Context State)**.
   - Token **tidak disimpan di `localStorage` atau `sessionStorage`**.
   - *Konsekuensi Keamanan*: `localStorage` dapat dibaca oleh seluruh skrip yang dieksekusi pada halaman yang sama (rentan XSS eksfiltrasi token). Dengan menyimpannya di memori, paparan serangan XSS berkurang signifikan. Bila tab ditutup atau di-refresh, state dibersihkan dan pengguna diarahkan ke login flow.
2. **Kondisi View 4-Serangkai**:
   - Seluruh halaman mengimplementasikan `ViewStateWrapper` (`loading`, `empty`, `error`, `content`).
3. **Concurrency Control (ETag & If-Match)**:
   - Polling berkala memanfaatkan `If-None-Match` untuk menerima `304 Not Modified`.
   - Transaksi mutasi serah terima mengirim `If-Match`. Respon `412` ditangani sebagai dialog domain alami, bukan error sistem.
