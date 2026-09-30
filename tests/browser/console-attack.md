# Panduan Uji Serangan Konsol Browser (A.9 Live Test)

Buka aplikasi web di browser, login sebagai **`pemohon-a`** (role: pemohon).
Di UI, tombol/menu "Konfirmasi Serah Terima" tidak ditampilkan karena UI menyembunyikannya.

Buka **Browser Developer Console (F12)**, lalu jalankan serangan manual:

```javascript
// Coba eksekusi operasi petugas lapangan (POST /v1/handovers) menggunakan token pemohon
const token = window.__bantuan?.getToken(); // atau ambil dari sesi aktif

fetch('https://contract-first-paket-bantuan-lapangan-production.up.railway.app/v1/handovers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({
    distributionId: 'dst_88bAa99',
    recipientNationalId: '3578021203920003',
    handedOverAt: new Date().toISOString(),
    fieldOfficerId: 'ofc_55xYz12'
  })
}).then(r => console.log('HTTP Status Penyerangan:', r.status));
```

**Hasil Wajib**: Console menampilkan status **`403 Forbidden`** (atau `404`), **TIDAK PERNAH 200**.
