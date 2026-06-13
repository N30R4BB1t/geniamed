CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_sex') THEN
    CREATE TYPE patient_sex AS ENUM ('F', 'M', 'O', 'NI');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'need_type') THEN
    CREATE TYPE need_type AS ENUM ('EMERGENCIA', 'CONSULTA', 'AGENDAMENTO', 'RETORNO', 'EXAME', 'OUTRO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occurrence_status') THEN
    CREATE TYPE occurrence_status AS ENUM ('ABERTA', 'ALERTA_ENVIADO', 'EM_PREPARO', 'AGUARDANDO', 'EM_ATENDIMENTO', 'FINALIZADA', 'CANCELADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE priority_level AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'RECEPCAO', 'ENFERMAGEM', 'MEDICO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role user_role NOT NULL DEFAULT 'RECEPCAO',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(160) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  birth_date DATE NOT NULL,
  sex patient_sex NOT NULL DEFAULT 'NI',
  phone VARCHAR(30),
  email VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospital_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  allergies TEXT,
  chronic_conditions TEXT,
  current_medications TEXT,
  blood_type VARCHAR(5),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(2) NOT NULL,
  phone VARCHAR(30),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unit_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  need need_type NOT NULL,
  category VARCHAR(80),
  subcategory VARCHAR(100),
  min_priority priority_level NOT NULL DEFAULT 'BAIXA',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  unit_id UUID REFERENCES units(id),
  need need_type NOT NULL,
  category VARCHAR(80),
  subcategory VARCHAR(100),
  details TEXT,
  patient_latitude NUMERIC(10, 7),
  patient_longitude NUMERIC(10, 7),
  priority priority_level NOT NULL DEFAULT 'BAIXA',
  status occurrence_status NOT NULL DEFAULT 'ABERTA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL UNIQUE REFERENCES occurrences(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id),
  queue_position INTEGER NOT NULL,
  status occurrence_status NOT NULL DEFAULT 'AGUARDANDO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor VARCHAR(120) NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity VARCHAR(120) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_users_username_lower ON app_users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_occurrences_unit_status ON occurrences(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_occurrences_created_at ON occurrences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_unit_position ON service_queue(unit_id, queue_position);
CREATE INDEX IF NOT EXISTS idx_units_active ON units(active);
CREATE INDEX IF NOT EXISTS idx_capabilities_lookup ON unit_capabilities(need, category, subcategory);

