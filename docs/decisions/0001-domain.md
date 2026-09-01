# Domain Decision

## Context

Penyaluran paket bantuan melibatkan beberapa aktor dengan hak akses berbeda. Petugas lapangan dapat bekerja di lokasi dengan koneksi tidak stabil, sedangkan pengajuan dan serah terima memiliki konsekuensi yang tidak boleh diproses dua kali.

## Decision

Kelompok memilih domain sistem penyaluran paket bantuan lapangan dengan cakupan dari pengajuan permintaan sampai konfirmasi paket diterima. Resource utama adalah assistance-requests, packages, distributions, dan handovers.

## Alternatives considered

- Sistem bantuan sosial lengkap ditolak karena mencakup pendanaan, pengadaan, dan pelaporan sehingga terlalu luas.
- Sistem inventori gudang ditolak karena tidak cukup menonjolkan aktor offline dan proses serah terima.
- Sistem pengiriman umum ditolak karena scope dan aturan bisnisnya terlalu luas.

## Consequences

- Mobile client petugas lapangan memerlukan durable mutation queue.
- Konfirmasi serah terima memerlukan Idempotency-Key.
- Service harus menolak penyaluran atau konfirmasi kedua.
- Spesifikasi perlu mendokumentasikan error domain dan transisi status.