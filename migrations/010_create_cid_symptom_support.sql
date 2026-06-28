CREATE TABLE IF NOT EXISTS cid10_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  kind VARCHAR(40) NOT NULL DEFAULT 'SUBCATEGORIA',
  parent_code VARCHAR(20),
  source VARCHAR(80) NOT NULL DEFAULT 'DATASUS',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cid10_codes_code ON cid10_codes(code);
CREATE INDEX IF NOT EXISTS idx_cid10_codes_description ON cid10_codes USING gin(to_tsvector('portuguese', coalesce(description, '') || ' ' || coalesce(short_description, '')));

CREATE TABLE IF NOT EXISTS symptom_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES symptom_groups(id) ON DELETE CASCADE,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS symptom_cid10_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id UUID NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  cid10_id UUID NOT NULL REFERENCES cid10_codes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symptom_id, cid10_id)
);

CREATE TABLE IF NOT EXISTS clinical_anamnesis_symptoms (
  anamnesis_id UUID NOT NULL REFERENCES clinical_anamneses(id) ON DELETE CASCADE,
  symptom_id UUID NOT NULL REFERENCES symptoms(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (anamnesis_id, symptom_id)
);

ALTER TABLE clinical_consultations
  ADD COLUMN IF NOT EXISTS cid10_id UUID REFERENCES cid10_codes(id) ON DELETE SET NULL;

INSERT INTO symptom_groups (code, name, description, sort_order) VALUES
  ('DOR', 'Dor', 'Sintomas dolorosos por localizacao.', 10),
  ('GERAL', 'Geral', 'Sinais e sintomas gerais.', 20),
  ('RESPIRATORIO', 'Respiratorio', 'Sintomas respiratorios e de vias aereas.', 30),
  ('DIGESTIVO', 'Digestivo', 'Sintomas gastrointestinais.', 40),
  ('NEUROLOGICO', 'Neurologico', 'Sintomas neurologicos.', 50),
  ('URINARIO', 'Urinario', 'Sintomas urinarios.', 60)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = TRUE;

INSERT INTO symptoms (group_id, code, name, keywords, sort_order)
SELECT g.id, s.code, s.name, s.keywords, s.sort_order
FROM symptom_groups g
JOIN (VALUES
  ('DOR', 'DOR_CABECA', 'Dor de cabeca', ARRAY['cefaleia','enxaqueca','dor de cabeca'], 10),
  ('DOR', 'DOR_TORACICA', 'Dor toracica', ARRAY['dor toracica','toracica','peito','angina'], 20),
  ('DOR', 'DOR_ABDOMINAL', 'Dor abdominal', ARRAY['dor abdominal','abdomen','colica abdominal'], 30),
  ('DOR', 'DOR_LOMBAR', 'Dor lombar', ARRAY['lombalgia','dor lombar'], 40),
  ('DOR', 'DOR_URINAR', 'Dor ao urinar', ARRAY['disuria','dor ao urinar'], 50),
  ('GERAL', 'FEBRE', 'Febre', ARRAY['febre','pirexia'], 10),
  ('GERAL', 'CANSACO', 'Cansaco', ARRAY['fadiga','cansaco','astenia'], 20),
  ('GERAL', 'PERDA_PESO', 'Perda de peso', ARRAY['perda de peso','emagrecimento'], 30),
  ('RESPIRATORIO', 'TOSSE', 'Tosse', ARRAY['tosse'], 10),
  ('RESPIRATORIO', 'CORIZA', 'Coriza', ARRAY['coriza','rinorreia'], 20),
  ('RESPIRATORIO', 'FALTA_AR', 'Falta de ar', ARRAY['dispneia','falta de ar'], 30),
  ('RESPIRATORIO', 'CHIADO', 'Chiado', ARRAY['sibilancia','chiado'], 40),
  ('DIGESTIVO', 'NAUSEA', 'Nausea', ARRAY['nausea','enjoo'], 10),
  ('DIGESTIVO', 'VOMITO', 'Vomito', ARRAY['vomito','emese'], 20),
  ('DIGESTIVO', 'DIARREIA', 'Diarreia', ARRAY['diarreia'], 30),
  ('DIGESTIVO', 'SANGUE_FEZES', 'Sangue nas fezes', ARRAY['melena','hematoquezia','sangue nas fezes'], 40),
  ('NEUROLOGICO', 'TONTURA', 'Tontura', ARRAY['tontura','vertigem'], 10),
  ('NEUROLOGICO', 'DESMAIO', 'Desmaio', ARRAY['sincope','desmaio'], 20),
  ('NEUROLOGICO', 'CONVULSAO', 'Convulsao', ARRAY['convulsao','epilepsia'], 30),
  ('NEUROLOGICO', 'CONFUSAO', 'Confusao mental', ARRAY['confusao mental','delirium'], 40),
  ('URINARIO', 'URGENCIA_URINARIA', 'Urgencia urinaria', ARRAY['urgencia urinaria','polaciuria'], 10),
  ('URINARIO', 'HEMATURIA', 'Sangue na urina', ARRAY['hematuria','sangue na urina'], 20)
) AS s(group_code, code, name, keywords, sort_order) ON s.group_code = g.code
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  keywords = EXCLUDED.keywords,
  sort_order = EXCLUDED.sort_order,
  active = TRUE;
