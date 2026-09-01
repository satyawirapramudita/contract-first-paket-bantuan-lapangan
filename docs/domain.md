# Domain

## Domain Paragraph

Pemohon mengajukan permintaan paket bantuan, kemudian koordinator memeriksa kelayakan dan menyetujui atau menolaknya. Setelah disetujui, petugas gudang menyiapkan paket dan petugas lapangan mengambilnya untuk diserahkan kepada penerima di lokasi yang koneksinya tidak selalu tersedia. Sistem harus mencegah satu permintaan menghasilkan lebih dari satu paket atau lebih dari satu konfirmasi serah terima apabila request dikirim ulang setelah koneksi terputus.

## Actors

| Aktor | Tanggung jawab | Hak akses utama |
|---|---|---|
| Pemohon | Mengajukan bantuan dan melihat status | Membuat dan membaca permintaan miliknya |
| Koordinator | Memeriksa kelayakan | Menyetujui atau menolak permintaan |
| Petugas gudang | Menyiapkan paket | Menandai paket siap |
| Petugas lapangan | Menyerahkan paket | Mengonfirmasi serah terima |

## End-to-End Workflow

1. Pemohon membuat permintaan bantuan.
2. Koordinator memeriksa permintaan.
3. Koordinator menyetujui atau menolak permintaan.
4. Petugas gudang menyiapkan paket jika permintaan disetujui.
5. Petugas lapangan mengambil paket.
6. Petugas lapangan menyerahkan paket kepada penerima.
7. Petugas lapangan mengirimkan konfirmasi serah terima.

## Possible Failures

- Request tidak valid.
- Pemohon tidak memiliki izin.
- Permintaan tidak memenuhi syarat.
- Paket tidak tersedia.
- Permintaan sudah disalurkan.
- Transisi status tidak valid.
- Koneksi petugas lapangan terputus.

## Domain Requirement Checks

- Syarat 1: Terpenuhi, karena terdapat pemohon, koordinator, petugas gudang, dan petugas lapangan dengan hak akses berbeda.
- Syarat 2: Terpenuhi, karena satu permintaan tidak boleh menghasilkan lebih dari satu penyaluran atau konfirmasi serah terima.
- Syarat 3: Terpenuhi, karena petugas lapangan dapat bekerja di lokasi dengan koneksi intermiten atau tidak tersedia.
- Syarat 4: Terpenuhi, karena cakupan dibatasi dari pengajuan permintaan sampai konfirmasi paket diterima.