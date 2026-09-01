# Sistem Penyaluran Paket Bantuan Lapangan

## Anggota dan Role

| Anggota | Role | Tanggung jawab |
|---|---|---|
| Dhimas | Contract Owner | Menyusun dan mereview `openapi.yaml` serta `CHANGELOG.md` |
| Naya | Service Owner | Menentukan domain, resource, dan aturan bisnis |
| Satya | Client Owner | Menganalisis client, idempotency, dan compatibility |
| Tama | Integration Owner | Menangani error catalog, mock server, README, dan demonstrasi |

## Scope

Sistem menangani proses dari pengajuan permintaan paket bantuan sampai konfirmasi paket diterima. Service belum diimplementasikan pada tugas ini.

## Repository Structure

```text
openapi.yaml
CHANGELOG.md
README.md
docs/
  decisions/
    0001-domain.md
  domain.md
  client-taxonomy.md
  resource-model.md
  business-rule.md
  idempotency.md
  error-catalog.md
  compatibility-policy.md
  mock-demo.md
service/
clients/
  web/
  mobile/
  device/
  mcp/
tests/
  contract/
```

