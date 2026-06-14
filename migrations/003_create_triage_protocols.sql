CREATE TABLE IF NOT EXISTS triage_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need need_type NOT NULL,
  need_label VARCHAR(80) NOT NULL,
  category_code VARCHAR(80),
  category_label VARCHAR(120),
  subcategory_code VARCHAR(100),
  subcategory_label VARCHAR(160),
  priority priority_level NOT NULL DEFAULT 'BAIXA',
  instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_triage_protocol_unique
  ON triage_protocols (
    need,
    COALESCE(category_code, ''),
    COALESCE(subcategory_code, '')
  );

CREATE INDEX IF NOT EXISTS idx_triage_protocol_lookup
  ON triage_protocols (active, need, category_code, subcategory_code);

INSERT INTO triage_protocols
  (need, need_label, category_code, category_label, subcategory_code, subcategory_label, priority, instructions, active, sort_order)
VALUES
  ('EMERGENCIA', 'Emergencia', 'DOR', 'Dor', 'DOR_NO_PEITO', 'Dor no peito / suspeita cardiovascular', 'CRITICA', 'Acionar equipe imediatamente e preparar avaliacao cardiovascular.', TRUE, 10),
  ('EMERGENCIA', 'Emergencia', 'DOR', 'Dor', 'DOR_ABDOMINAL', 'Dor abdominal', 'ALTA', 'Preparar avaliacao clinica e cirurgia geral se necessario.', TRUE, 20),
  ('EMERGENCIA', 'Emergencia', 'DOR', 'Dor', 'DOR_CABECA', 'Dor de cabeca intensa', 'MEDIA', 'Avaliar sinais neurologicos e intensidade da dor.', TRUE, 30),
  ('EMERGENCIA', 'Emergencia', 'DOR', 'Dor', 'DOR_MEMBRO', 'Dor em membro', 'MEDIA', 'Avaliar trauma, circulacao e limitacao funcional.', TRUE, 40),
  ('EMERGENCIA', 'Emergencia', 'TRAUMA', 'Trauma', 'FRATURA', 'Fratura aparente ou suspeita', 'ALTA', 'Preparar ortopedia e imagem.', TRUE, 50),
  ('EMERGENCIA', 'Emergencia', 'TRAUMA', 'Trauma', 'QUEDA', 'Queda', 'MEDIA', 'Avaliar trauma, dor e perda de consciencia.', TRUE, 60),
  ('EMERGENCIA', 'Emergencia', 'TRAUMA', 'Trauma', 'AMPUTACAO', 'Amputacao', 'CRITICA', 'Acionar emergencia, controle de sangramento e centro cirurgico.', TRUE, 70),
  ('EMERGENCIA', 'Emergencia', 'FERIMENTO', 'Corte ou lesao', 'CORTE_LESAO', 'Corte ou lesao', 'MEDIA', 'Avaliar profundidade, contaminacao e necessidade de sutura.', TRUE, 80),
  ('EMERGENCIA', 'Emergencia', 'FERIMENTO', 'Corte ou lesao', 'SANGRAMENTO_INTENSO', 'Sangramento intenso', 'CRITICA', 'Acionar equipe imediatamente e preparar controle de hemorragia.', TRUE, 90),
  ('EMERGENCIA', 'Emergencia', 'FERIMENTO', 'Corte ou lesao', 'QUEIMADURA', 'Queimadura', 'ALTA', 'Avaliar extensao, grau e vias aereas.', TRUE, 100),
  ('EMERGENCIA', 'Emergencia', 'RESPIRATORIO', 'Respiratorio', 'FALTA_AR', 'Falta de ar', 'CRITICA', 'Acionar equipe imediatamente e preparar suporte ventilatorio.', TRUE, 110),
  ('EMERGENCIA', 'Emergencia', 'RESPIRATORIO', 'Respiratorio', 'CRISE_ASMA', 'Crise de asma/bronquite', 'ALTA', 'Preparar avaliacao respiratoria e medicacao conforme protocolo.', TRUE, 120),
  ('CONSULTA', 'Consulta', NULL, NULL, NULL, NULL, 'BAIXA', 'Encaminhar para fluxo ambulatorial.', TRUE, 200),
  ('AGENDAMENTO', 'Agendamento', NULL, NULL, NULL, NULL, 'BAIXA', 'Encaminhar para central de agendamento.', TRUE, 210),
  ('RETORNO', 'Retorno', NULL, NULL, NULL, NULL, 'BAIXA', 'Encaminhar para retorno conforme especialidade.', TRUE, 220),
  ('EXAME', 'Exame', NULL, NULL, NULL, NULL, 'BAIXA', 'Encaminhar para unidade com capacidade de exame.', TRUE, 230),
  ('OUTRO', 'Outro', NULL, NULL, NULL, NULL, 'BAIXA', 'Encaminhar para classificacao inicial.', TRUE, 240)
ON CONFLICT DO NOTHING;

