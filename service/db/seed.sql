-- ============================================================
-- Seed data for demonstration (Session 4)
-- Run AFTER schema.sql: psql $DATABASE_URL -f seed.sql
-- ============================================================

-- Sample assistance requests (subject = Keycloak preferred_username)
INSERT INTO assistance_requests (id, applicant_subject, applicant_national_id, applicant_name, family_member_count, target_location, required_package_type, status, urgency, requested_at)
VALUES
  ('req_7Kq91Ab', 'pemohon-a', '3201012304950001', 'Budi Santoso', 4, 'Desa Sukamaju RT 02/04, Posko Bencana 1', 'family_food_pack', 'approved', 'high', '2026-09-01T09:15:00+07:00'),
  ('req_2Mn85Cd', 'pemohon-b', '3271056709800002', 'Siti Rahayu', 2, 'Kelurahan Cempaka, Tenda Darurat 5', 'medical_emergency_kit', 'approved', 'critical', '2026-09-01T10:30:00+07:00'),
  ('req_3Pq72Ef', 'pemohon-c', '3578021203920003', 'Ahmad Fauzi', 6, 'Dusun Mekar Sari, Posko 3', 'baby_essentials', 'allocated', 'medium', '2026-09-01T08:00:00+07:00')
ON CONFLICT (id) DO NOTHING;

-- Sample packages
INSERT INTO packages (id, package_code, package_type, preparation_status, warehouse_location, ready_at)
VALUES
  ('pkg_44Lk90a', 'LOG-SEMBAKO-001', 'family_food_pack', 'ready_for_pickup', 'Gudang Utama Posko Logistik Induk', '2026-09-01T11:00:00+07:00'),
  ('pkg_55Mk91b', 'LOG-MEDIS-001', 'medical_emergency_kit', 'assembled', 'Gudang Utama Posko Logistik Induk', '2026-09-01T11:30:00+07:00')
ON CONFLICT (id) DO NOTHING;

-- Sample distributions:
--   dst_88bAa99 milik petugas-a (dipakai contract test untuk handover sukses)
--   dst_99cBb00 milik petugas-b (dipakai authz test sebagai objek "bukan miliknya")
INSERT INTO distributions (id, request_id, package_id, field_officer_id, field_officer_subject, distribution_status, allocated_at)
VALUES
  ('dst_88bAa99', 'req_3Pq72Ef', 'pkg_44Lk90a', 'ofc_55xYz12', 'petugas-a', 'in_transit', '2026-09-01T12:00:00+07:00'),
  ('dst_99cBb00', 'req_2Mn85Cd', 'pkg_55Mk91b', 'ofc_66zZa34', 'petugas-b', 'assigned', '2026-09-01T12:30:00+07:00')
ON CONFLICT (id) DO NOTHING;
