# Resource Modeling

Resource harus memiliki identitas, masa hidup, dan kemandirian.

| Kandidat | Keputusan | Alasan |
|---|---|---|
| assistance-requests | Resource | Memiliki requestId, tetap ada dari pengajuan sampai selesai, dan statusnya dapat berubah |
| packages | Resource | Memiliki packageId, tetap ada selama proses penyiapan dan penyaluran, serta statusnya dapat berubah |
| distributions | Resource | Memiliki distributionId dan menjadi catatan penyaluran yang dapat ditugaskan serta diperbarui |
| handovers | Resource | Memiliki handoverId dan tetap ada sebagai bukti serah terima |
| review | Ditolak | Merupakan proses atau keputusan terhadap assistance-request, bukan entitas mandiri |
| dashboard | Ditolak | Merupakan tampilan yang menggabungkan beberapa resource |
| notification | Ditolak sebagai resource utama | Merupakan efek samping komunikasi, bukan resource inti workflow |
| eligibility-check | Ditolak | Merupakan proses validasi, bukan entitas yang perlu memiliki masa hidup mandiri |