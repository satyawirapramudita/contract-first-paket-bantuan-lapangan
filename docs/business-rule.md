# Business Rule Decomposition

## Main Rule

Satu permintaan bantuan yang telah disetujui hanya boleh menghasilkan satu penyaluran dan satu konfirmasi serah terima yang berhasil.

## Service Layer

Service menegakkan aturan secara otoritatif. Service menolak penyaluran kedua atau konfirmasi kedua untuk permintaan yang sama.

## Contract Layer

Kontrak mendokumentasikan status yang valid, transisi yang diizinkan, dan 409 Conflict apabila permintaan sudah disalurkan atau telah dikonfirmasi.

## Client Layer

Client dapat menonaktifkan tombol konfirmasi setelah sukses dan menampilkan status terbaru. Client bukan mekanisme penegakan aturan.

## Valid State Transitions

| Current state | Operation | Next state |
|---|---|---|
| submitted | start review | under_review |
| under_review | approve | approved |
| under_review | reject | rejected |
| approved | prepare | prepared |
| prepared | dispatch | in_transit |
| in_transit | handover | delivered |