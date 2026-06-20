ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS awaiting_arrival_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

ALTER TABLE clinical_consultations
  ADD COLUMN IF NOT EXISTS occurrence_id UUID REFERENCES occurrences(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_consultations_occurrence
  ON clinical_consultations(occurrence_id)
  WHERE occurrence_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS occurrence_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  from_status occurrence_status,
  to_status occurrence_status NOT NULL,
  actor VARCHAR(120) NOT NULL DEFAULT 'Dashboard operacional',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occurrence_status_history_occurrence
  ON occurrence_status_history(occurrence_id, created_at);

INSERT INTO occurrence_status_history (occurrence_id, from_status, to_status, actor, notes, created_at)
SELECT o.id, NULL, o.status, 'Migracao', 'Estado existente registrado na ativacao do fluxo operacional.', o.created_at
  FROM occurrences o
 WHERE NOT EXISTS (
   SELECT 1
     FROM occurrence_status_history h
    WHERE h.occurrence_id = o.id
 );
