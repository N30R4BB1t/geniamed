CREATE TABLE clinical_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  consultation_id UUID REFERENCES clinical_consultations(id) ON DELETE SET NULL,
  evolution_type VARCHAR(80) NOT NULL DEFAULT 'EVOLUCAO',
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Dra. Estudante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  consultation_id UUID REFERENCES clinical_consultations(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  document_type VARCHAR(80) NOT NULL DEFAULT 'OUTRO',
  file_name VARCHAR(220),
  file_url TEXT,
  description TEXT,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Dra. Estudante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_evolutions_patient ON clinical_evolutions(patient_id, created_at DESC);
CREATE INDEX idx_clinical_attachments_patient ON clinical_attachments(patient_id, created_at DESC);
