# Client Taxonomy

## Planned Clients

The planned clients are a web client for applicants, coordinators, and warehouse officers, and a mobile client for field officers.

## Web Client

| Sumbu | Analisis |
|---|---|
| Kemampuan menyimpan rahasia | Browser tidak dapat menyimpan secret service di luar jangkauan pengguna sehingga client memerlukan public-client flow |
| Ketersediaan jaringan | Umumnya tersedia, tetapi request tetap dapat terputus sebelum response diterima |
| Anggaran latensi | Operasi membaca dan memperbarui permintaan sebaiknya merespons dalam beberapa detik |
| Batas sumber daya | Memori dan bandwidth relatif cukup, tetapi response koleksi tetap memerlukan limit dan cursor |
| Kehadiran manusia | Pemohon dan koordinator dapat menafsirkan detail error dan mengambil keputusan |

### Kesimpulan

Karena web client tidak dapat menyimpan secret di luar jangkauan pengguna, autentikasi harus menggunakan public-client flow; karena pengguna manusia menafsirkan error, response perlu menyediakan alasan yang dapat ditindaklanjuti.

## Mobile Client Petugas Lapangan

| Sumbu | Analisis |
|---|---|
| Kemampuan menyimpan rahasia | Perangkat dikuasai pengguna sehingga tidak boleh menyimpan secret service |
| Ketersediaan jaringan | Jaringan intermiten atau sering tidak tersedia di lokasi lapangan |
| Anggaran latensi | Konfirmasi serah terima tidak boleh bergantung pada response jaringan yang segera |
| Batas sumber daya | Penyimpanan, baterai, dan bandwidth terbatas |
| Kehadiran manusia | Petugas dapat menafsirkan konflik, data tidak lengkap, atau kegagalan pengiriman |

### Kesimpulan

Karena jaringan mobile client petugas lapangan intermiten dan perangkat memiliki sumber daya terbatas, client memerlukan durable mutation queue; operasi unsafe seperti konfirmasi serah terima memerlukan Idempotency-Key.
