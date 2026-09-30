# A.1 Scope of the Application — User Workflows

Tabel berikut mendefinisikan alur kerja pengguna (user workflows) yang diimplementasikan pada aplikasi web klien per perannya. Setiap baris memetakan layar antarmuka ke operasi kontrak `openapi.yaml` yang benar-benar ada.

| Workflow | Screen / View | URL Route | Role Permitted | Operation in openapi.yaml | Calls / Screen |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **1. Pemohon mengajukan permohonan dan memantau status bantuan** | Formulir Pengajuan Permohonan Bantuan Baru | `/requests/new` | `pemohon` | `POST /v1/assistance-requests` | 1 |
| | Riwayat Permohonan Bantuan Saya | `/requests` | `pemohon` | `GET /v1/assistance-requests` | 1 |
| | Detail Status & Alokasi Permohonan | `/requests/:id` | `pemohon` | `GET /v1/assistance-requests/{requestId}` | 1 |
| **2. Petugas lapangan memverifikasi tugas dan mencatat serah terima (Handover)** | Daftar Alokasi Distribusi Lapangan Aktif | `/distributions` | `petugas-lapangan` | `GET /v1/distributions` | 1 |
| | Detail Alokasi & Verifikasi Lapangan | `/distributions/:id` | `petugas-lapangan` | `GET /v1/distributions/{distributionId}` | 1 |
| | Konfirmasi Serah Terima Paket (Handover) | `/distributions/:id/handover` | `petugas-lapangan` | `POST /v1/handovers` | 1 |
| **3. Koordinator posko memantau permohonan masuk dan inventaris logistik** | Dasbor Pengawasan Seluruh Permohonan Bantuan | `/coordinator/requests` | `koordinator` | `GET /v1/assistance-requests` | 1 |
| | Dasbor Monitoring Inventaris Paket Gudang | `/coordinator/packages` | `koordinator`, `petugas-gudang` | `GET /v1/packages` | 1 |

### Analisis Kepatuhan Kontrak (Mandatory Checks):
1. **Keberadaan Operasi**: Semua operasi pada kolom terakhir (`POST /v1/assistance-requests`, `GET /v1/assistance-requests`, `GET /v1/assistance-requests/{requestId}`, `GET /v1/distributions`, `GET /v1/distributions/{distributionId}`, `POST /v1/handovers`, `GET /v1/packages`) eksis di `openapi.yaml`. Tidak ada endpoint bayangan atau fiktif.
2. **Kesesuaian Hak Akses (Role)**:
   - `pemohon` memegang scope `requests:read`, `requests:write`.
   - `petugas-lapangan` memegang scope `requests:read`, `distributions:read`, `handovers:write`.
   - `koordinator` memegang scope `requests:read`, `requests:review`, `packages:read`, `distributions:read`.
3. **Budget Panggilan Jaringan**: Maksimal 1 panggilan REST per rendering layar. Tidak ada layar yang memerlukan multiple sequential calls yang menandakan cacat pemodelan resource.
