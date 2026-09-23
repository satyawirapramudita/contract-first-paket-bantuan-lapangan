# Session 4 Demo Checklist (Step 12d)

Isi kolom bukti dengan output nyata yang dijalankan pada lingkungan demo.

| Selesai | Pemeriksaan | Perintah / bukti | Hasil |
| :---: | :--- | :--- | :--- |
| [ ] | Request tanpa token ditolak | `curl -s -o /dev/null -w '%{http_code}' $BASE/v1/assistance-requests` → 401 | |
| [ ] | Token yang diedit ditolak | ubah satu karakter payload lalu kirim → 401 | |
| [ ] | Scope yang kurang ditolak | token pemohon ke `POST /v1/handovers` → 403 + `insufficient_scope` | |
| [ ] | Objek milik orang lain ditolak | token pemohon-a ke `req_2Mn85Cd` (milik pemohon-b) → 404 | |
| [ ] | "Tidak ada" dan "bukan miliknya" identik | `diff` dua respons 404 → tidak ada perbedaan | |
| [ ] | Tidak ada secret di public client | cek konfigurasi `web-posko`/`mobile-petugas`: Client authentication Off, tanpa secret | |
| [ ] | Tidak ada token di log | `grep -RniE 'bearer ey[A-Za-z0-9_-]{10,}' service/logs/ /tmp/service.log` → `clean` | |
| [ ] | Rotasi refresh token bekerja | tiga perintah Step 10 di `docs/decisions/0003-autentikasi.md` | |
| [ ] | Empat uji negatif hijau di CI | link pipeline GitHub Actions job `test` | |

## Perintah Bukti Cepat

```bash
BASE=http://localhost:3000
TOKEN_PEMOHON=$(node tests/helpers/token.js pemohon-a requests:read requests:write)
TOKEN_PETUGAS=$(node tests/helpers/token.js petugas-a requests:read distributions:read handovers:write)

# 401 tanpa token
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/v1/assistance-requests"

# 404 bukan miliknya vs 404 tidak ada (harus identik)
diff <(curl -s -H "Authorization: Bearer $TOKEN_PEMOHON" "$BASE/v1/assistance-requests/req_2Mn85Cd") \
     <(curl -s -H "Authorization: Bearer $TOKEN_PEMOHON" "$BASE/v1/assistance-requests/req_ZZZZZZZ") \
  && echo "both responses are identical"

# 404 endpoint distribusi (boundary ke-4)
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN_PETUGAS" "$BASE/v1/distributions/dst_99cBb00"

# 403 scope
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H "Authorization: Bearer $TOKEN_PEMOHON" \
  -H "Idempotency-Key: $(node -e "console.log(require('crypto').randomUUID())")" \
  -H "Content-Type: application/json" \
  -d '{"distributionId":"dst_88bAa99","recipientNationalId":"3578021203920003","handedOverAt":"2026-09-19T10:00:00+07:00","fieldOfficerId":"ofc_55xYz12"}' \
  "$BASE/v1/handovers"
```

## Bukti Red/Green (Step 11c)

Untuk setiap object check, satu per satu:

1. Nonaktifkan pemeriksaan (comment baris `if (!mayReadRequest(...))` atau
   `if (!mayHandover(...))` di handler yang bersangkutan).
2. Jalankan `bash tests/authz/run.sh` → uji terkait **HARUS GAGAL (merah)**.
3. Pulihkan baris, jalankan ulang → **HARUS HIJAU**.
4. Catat hasil per boundary di tabel ini:

| Boundary | Uji | Merah saat check dihapus? | Hijau saat dipulihkan? |
| :---: | :--- | :---: | :---: |
| 1 | pemohon-a baca request pemohon-b | | |
| 2 | petugas-a handover distribusi petugas-b | | |
| 3 | pemohon ke operasi staff (scope) | | |
| 4 | petugas-a baca distribusi petugas-b | | |

## Bukti Log Bersih

```bash
grep -RniE 'bearer ey[A-Za-z0-9_-]{10,}' service/logs/ 2>/dev/null && echo "STILL LEAKING" || echo "clean"
```
