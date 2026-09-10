-- ============================================================
-- Field Aid Package Distribution System — Database Schema
-- Run this on an empty database: psql $DATABASE_URL -f schema.sql
-- ============================================================

-- Assistance Requests
CREATE TABLE IF NOT EXISTS assistance_requests (
    id               TEXT PRIMARY KEY,          -- format: req_XXXXXXX
    applicant_national_id TEXT NOT NULL,
    applicant_name   TEXT NOT NULL,
    family_member_count INTEGER,
    target_location  TEXT,
    required_package_type TEXT,
    status           TEXT NOT NULL DEFAULT 'submitted',
    urgency          TEXT NOT NULL DEFAULT 'medium',
    requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Packages (logistik gudang)
CREATE TABLE IF NOT EXISTS packages (
    id                  TEXT PRIMARY KEY,       -- format: pkg_XXXXXXX
    package_code        TEXT NOT NULL UNIQUE,
    package_type        TEXT NOT NULL,
    preparation_status  TEXT NOT NULL DEFAULT 'draft',
    warehouse_location  TEXT,
    ready_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Distributions (alokasi lapangan)
CREATE TABLE IF NOT EXISTS distributions (
    id                  TEXT PRIMARY KEY,       -- format: dst_XXXXXXX
    request_id          TEXT NOT NULL REFERENCES assistance_requests(id),
    package_id          TEXT NOT NULL REFERENCES packages(id),
    field_officer_id    TEXT NOT NULL,
    distribution_status TEXT NOT NULL DEFAULT 'assigned',
    allocated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Handovers (bukti serah terima)
CREATE TABLE IF NOT EXISTS handovers (
    id                    TEXT PRIMARY KEY,     -- format: hnd_XXXXXXX
    distribution_id       TEXT NOT NULL REFERENCES distributions(id),
    recipient_national_id TEXT NOT NULL,
    field_officer_id      TEXT,
    handed_over_at        TIMESTAMPTZ NOT NULL,
    status                TEXT NOT NULL DEFAULT 'confirmed',
    recipient_notes       TEXT
);

-- Idempotency Keys (WAJIB di DB, bukan memory)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key          TEXT PRIMARY KEY,
    body_hash    TEXT NOT NULL,
    response_body TEXT NOT NULL,
    status_code  INTEGER NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
