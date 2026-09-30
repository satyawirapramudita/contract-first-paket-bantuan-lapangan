# Session 5 & 6 Verification Checklist

| Status | Skenario Pengujian (Sesuai Urutan Grader Session 7) | Indikator Keberhasilan |
| :---: | :--- | :--- |
| [ ] | 1. Buka URL aplikasi tanpa login | Diarahkan ke halaman login, bukan layar putih/error. |
| [ ] | 2. Login akun pertama & selesaikan satu workflow A.1 | Muncul skeleton dulu, lalu data muncul. Hasil tetap ada setelah reload. |
| [ ] | 3. Salin URL di tengah workflow dan buka di tab baru | Layar yang sama terbuka dengan data yang sama (URL bookmarkable). |
| [ ] | 4. Kosongkan satu required field form lalu submit | Pesan error muncul tepat di bawah field tersebut (dari Problem 400). |
| [ ] | 5. Buka satu entitas di dua tab, klik aksi yang sama di keduanya | Tab kedua menampilkan penjelasan domain bahwa paket sudah diproses (412). |
| [ ] | 6. Kirim request terlarang lewat browser console | Service membalas 403 / 404, tidak pernah 200. |
