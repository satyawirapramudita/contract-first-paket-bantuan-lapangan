# ADR 0003 — Authentication and Access Control (Session 4)

Date: 2026-09-19
Status: Accepted

## Context

Tugas P3 (Session 3) menghasilkan service yang cocok dengan kontrak tetapi belum
memeriksa siapa pemanggilnya. Session 4 menambahkan tiga lapis pemeriksaan akses
yang terpisah:

1. **Authentication** — memverifikasi token dan membentuk `req.principal`.
2. **Scope check** — membandingkan scope token dengan scope yang dibutuhkan operasi.
3. **Object check** — di dalam handler, memeriksa hubungan pemanggil dengan objek
   yang disebut request.

Aturan keamanan yang dipegang: kegagalan object check dan objek yang tidak ada
menghasilkan respons `404` yang identik, sehingga identifier tidak dapat dienumerasi.

## Decision

### 1. Authorisation server: Keycloak

- Keycloak 26 dijalankan via Docker untuk pengembangan dan demonstrasi
  (`infra/docker-compose.auth.yml`).
- Keycloak juga di-deploy publik di Railway (`infra/keycloak/Dockerfile`) agar
  service yang sudah di-deploy dapat memverifikasi token asli pada Session 5-7.
- Realm: `bantuan-lapangan`; audience service: `bantuan-lapangan-api`.
- Rotasi refresh token dan reuse detection diaktifkan
  (`revokeRefreshToken: true`, `refreshTokenMaxReuse: 0`).

### 2. Pemetaan subject: `preferred_username`

Service memakai klaim `preferred_username` sebagai subject domain (dengan fallback
`sub`) supaya baris database dapat dicocokkan dengan aktor manusia
(`pemohon-a`, `petugas-b`, dan seterusnya). Konsekuensinya, mengganti username di
Keycloak berarti mengganti identitas kepemilikan; ini dicatat sebagai trade-off
yang diterima untuk skala tugas ini.

### 3. Strategi token untuk test: local test key

Test authz membuat pasangan kunci RS256 sendiri di dalam proses test, menyajikan
JWKS-nya dari HTTP server kecil (`tests/helpers/jwks-server.js`), dan menandatangani
token uji (`tests/helpers/token.js`). CI tidak membutuhkan akses jaringan ke
Keycloak. Kunci ini hanya hidup di dalam lingkungan test dan tidak pernah dipakai
di service nyata. Konfigurasi Keycloak (Step 10) tetap diverifikasi manual.

### 4. Klasifikasi client (Step 1)

| Client | Runs on | Public / Confidential | Flow | Memegang secret? |
| :--- | :--- | :--- | :--- | :--- |
| `web-posko` (Session 5) | Browser pengguna | **Public** | Authorization Code + PKCE (S256) | **Tidak** |
| `mobile-petugas` (Session 6) | Perangkat petugas lapangan | **Public** | Authorization Code + PKCE (S256) | **Tidak** |
| `job-rekonsiliasi` | Server tim (tanpa pengguna) | **Confidential** | Client Credentials | Ya, di environment/secret manager Railway |

Client publik tidak pernah menyimpan client secret. Mengaburkan atau memecah
secret di dalam aplikasi publik tidak membuatnya rahasia: pengguna yang menguasai
perangkat tetap dapat merekonstruksinya.

### 5. Kosakata scope (Step 2)

| Scope | Mengizinkan | Pemohon | Koordinator | Petugas Gudang | Petugas Lapangan | Job |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `requests:read` | Melihat permohonan yang terlihat oleh pemanggil | milik sendiri | semua | — | yang ditugaskan | — |
| `requests:write` | Mengajukan permohonan milik sendiri | ya | — | — | — | — |
| `requests:review` | Meninjau dan menyetujui/menolak permohonan | — | ya | — | — | — |
| `packages:read` | Melihat inventaris paket gudang | — | ya | ya | ya | — |
| `distributions:read` | Melihat alokasi distribusi | — | semua | — | milik sendiri | semua |
| `handovers:write` | Mengonfirmasi serah terima | — | — | — | milik sendiri | — |

Enam scope ini diturunkan dari kapabilitas aktor, bukan dari daftar endpoint.
`requests:review` belum dipakai endpoint apa pun pada Session 4 (endpoint
approve/reject menyusul), tetapi tetap dideklarasikan karena merupakan kapabilitas
nyata Koordinator dan dipakai untuk menentukan visibilitas koleksi.

Scope TIDAK memberi akses ke semua objek. Scope menentukan jenis operasi; object
check di dalam handler (Step 8) yang menentukan baris mana yang terlihat.

### 6. Penyimpanan token (Step 10a)

| Platform | Access token | Refresh token | Dihindari |
| :--- | :--- | :--- | :--- |
| Browser | Di memori | Cookie `HttpOnly`, `Secure`, `SameSite` | `localStorage` |
| Android | Di memori | `EncryptedSharedPreferences` / Keystore | `SharedPreferences` biasa |
| iOS | Di memori | Keychain | `UserDefaults` |
| Server-side job | Di memori | Secret manager, disuntik saat runtime | Source code / `.env` yang di-commit |

Access token berumur pendek (5 menit di realm dev). Refresh token hanya dikirim
ke authorisation server, tidak pernah ke API ini.

## Alternatives Considered

| Alternatif | Alasan Ditolak |
| :--- | :--- |
| Keycloak hanya lokal (tanpa deploy publik) | Service Railway tidak dapat menjangkau JWKS localhost; Session 5-7 membutuhkan issuer publik |
| Hosted IdP lain | Tim sudah memilih Keycloak; kontrol penuh atas konfigurasi rotasi/reuse detection |
| Menyimpan token test di Keycloak dan mengambilnya saat CI | CI menjadi bergantung pada jaringan dan kredensial; lambat dan flaky |
| Memakai `sub` sebagai subject | Sulit dicocokkan dengan data seed; UUID Keycloak tidak stabil antar-import |
| Satu scope per endpoint | Kosakata menjadi cerminan daftar endpoint, bukan kapabilitas aktor |

## Consequences

- `openapi.yaml` naik ke `1.1.0` (breaking): semua operasi `/v1/**` butuh token.
- Test contract Session 3 harus mengirim token; runner disesuaikan, kontrak tidak.
- `OIDC_ISSUER`, `OIDC_JWKS_URI`, dan `OIDC_AUDIENCE` wajib ada; service menolak
  start bila salah satu kosong.
- Empat uji negatif menutup empat boundary berbeda: pemohon↔pemohon,
  petugas↔petugas (write), pemohon vs operasi staff (scope), dan
  petugas↔petugas (read).
- `GET /v1/distributions/{distributionId}` ditambahkan (compatible addition) agar
  boundary object read petugas↔petugas dapat diuji.

## Step 10 Evidence — Refresh Rotation and Reuse Detection

> Bagian ini diisi pada commit ketiga Client Owner setelah Keycloak berjalan
> (lihat Bagian 7.2). Tempel output asli ketiga perintah.

Setting yang diaktifkan pada realm `bantuan-lapangan`:

- `revokeRefreshToken: true` (rotasi refresh token)
- `refreshTokenMaxReuse: 0` (reuse token lama mencabut seluruh token family)

```text
(1) RT1 != RT2  → rotation is working
(tempel output)

(2) reuse RT1 → error
(tempel output)

(3) RT2 setelah family dicabut → error
(tempel output)
```
