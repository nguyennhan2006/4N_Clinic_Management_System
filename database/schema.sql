-- 4N_Clinic_Management_System
-- Phase 1 PostgreSQL 18 schema draft
-- Scope: database structure for Phase 1 / ver1
-- Notes:
--   1) This SQL mirrors backend/prisma/schema.prisma at a practical level.
--   2) Business rules that require multi-row / workflow checks stay in service layer.
--   3) This script is safe for local dev reset scenarios; review before production use.

BEGIN;

CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');
CREATE TYPE visit_status AS ENUM ('REGISTERED', 'WAITING', 'IN_EXAMINATION', 'COMPLETED', 'CANCELLED');
CREATE TYPE examination_status AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');
CREATE TYPE diagnosis_type AS ENUM ('PRIMARY', 'SECONDARY');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID');
CREATE TYPE payment_method AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER');
CREATE TYPE regulation_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);

CREATE TABLE role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, created_at);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  citizen_id TEXT UNIQUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_name_dob ON patients(full_name, date_of_birth);
CREATE INDEX idx_patients_phone ON patients(phone);

CREATE TABLE daily_visit_counters (
  visit_date DATE PRIMARY KEY,
  last_queue_number INTEGER NOT NULL DEFAULT 0 CHECK (last_queue_number >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  visit_date DATE NOT NULL,
  queue_number INTEGER NOT NULL,
  status visit_status NOT NULL DEFAULT 'WAITING',
  assigned_doctor_id TEXT REFERENCES users(id),
  reason TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visit_date, queue_number)
);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_visit_date_status ON visits(visit_date, status);
CREATE INDEX idx_visits_assigned_doctor ON visits(assigned_doctor_id, status);

CREATE TABLE diseases (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE examinations (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL UNIQUE REFERENCES visits(id),
  doctor_id TEXT NOT NULL REFERENCES users(id),
  status examination_status NOT NULL DEFAULT 'OPEN',
  symptoms TEXT,
  clinical_notes TEXT,
  conclusion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_examinations_doctor ON examinations(doctor_id);

CREATE TABLE examination_diagnoses (
  id TEXT PRIMARY KEY,
  examination_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  disease_id TEXT NOT NULL REFERENCES diseases(id),
  diagnosis_type diagnosis_type NOT NULL,
  note TEXT,
  UNIQUE (examination_id, disease_id, diagnosis_type)
);

CREATE TABLE drugs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescriptions (
  id TEXT PRIMARY KEY,
  examination_id TEXT NOT NULL UNIQUE REFERENCES examinations(id),
  doctor_id TEXT REFERENCES users(id),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescription_items (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_id TEXT NOT NULL REFERENCES drugs(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  dosage_value NUMERIC(10,2) NOT NULL CHECK (dosage_value > 0),
  dosage_text TEXT,
  frequency TEXT,
  duration TEXT,
  note TEXT,
  unit_price_snapshot NUMERIC(12,2) NOT NULL CHECK (unit_price_snapshot >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prescription_id, drug_id)
);
CREATE INDEX idx_prescription_items_drug ON prescription_items(drug_id);

CREATE TABLE regulation_versions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status regulation_status NOT NULL DEFAULT 'DRAFT',
  effective_from DATE NOT NULL,
  created_by TEXT REFERENCES users(id),
  activated_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_regulation_versions_status_effective ON regulation_versions(status, effective_from);

CREATE TABLE regulation_values (
  id TEXT PRIMARY KEY,
  regulation_version_id TEXT NOT NULL REFERENCES regulation_versions(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  UNIQUE (regulation_version_id, rule_key)
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL UNIQUE REFERENCES visits(id),
  status invoice_status NOT NULL DEFAULT 'DRAFT',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  issued_at TIMESTAMPTZ,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoices_status_issued_at ON invoices(status, issued_at);

CREATE TABLE invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_snapshot NUMERIC(12,2) NOT NULL CHECK (unit_price_snapshot >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0)
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method payment_method NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL,
  received_by TEXT REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

COMMIT;
