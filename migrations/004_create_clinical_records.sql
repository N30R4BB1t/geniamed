CREATE TYPE consultation_status AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'RETORNO_SOLICITADO');

CREATE TABLE clinical_triages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  complaint TEXT NOT NULL,
  systolic INTEGER,
  diastolic INTEGER,
  heart_rate INTEGER,
  resp_rate INTEGER,
  temperature NUMERIC(4, 1),
  saturation INTEGER,
  weight NUMERIC(5, 2),
  height NUMERIC(4, 2),
  bmi NUMERIC(5, 2),
  pain_scale INTEGER,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Dra. Estudante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  complaint TEXT NOT NULL,
  current_history TEXT NOT NULL,
  personal_history TEXT,
  surgical_history TEXT,
  allergies TEXT,
  medications TEXT,
  gyneco_history TEXT,
  family_history TEXT,
  habits TEXT,
  systems_review TEXT,
  physical_exam TEXT,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Dra. Estudante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  triage_id UUID REFERENCES clinical_triages(id) ON DELETE SET NULL,
  anamnesis_id UUID REFERENCES clinical_anamneses(id) ON DELETE SET NULL,
  status consultation_status NOT NULL DEFAULT 'EM_ANDAMENTO',
  cid TEXT,
  conduct TEXT,
  return_guidance TEXT,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Dra. Estudante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  consultation_id UUID REFERENCES clinical_consultations(id) ON DELETE SET NULL,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Dra. Estudante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES clinical_prescriptions(id) ON DELETE CASCADE,
  medication TEXT NOT NULL,
  dose TEXT NOT NULL,
  pharmaceutical_form TEXT NOT NULL,
  route TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_clinical_triages_patient ON clinical_triages(patient_id, created_at DESC);
CREATE INDEX idx_clinical_anamneses_patient ON clinical_anamneses(patient_id, created_at DESC);
CREATE INDEX idx_clinical_consultations_patient ON clinical_consultations(patient_id, created_at DESC);
CREATE INDEX idx_clinical_prescriptions_patient ON clinical_prescriptions(patient_id, created_at DESC);
