ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS tracking_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_speed_mps NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS distance_to_unit_km NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS eta_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS proximity_alert_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_occurrences_tracking_token
  ON occurrences(tracking_token);

CREATE TABLE IF NOT EXISTS occurrence_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  accuracy_meters NUMERIC(10, 2),
  speed_mps NUMERIC(8, 2),
  distance_to_unit_km NUMERIC(10, 2),
  eta_minutes INTEGER,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occurrence_locations_recent
  ON occurrence_location_history(occurrence_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS occurrence_unit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  current_unit_id UUID NOT NULL REFERENCES units(id),
  suggested_unit_id UUID NOT NULL REFERENCES units(id),
  current_distance_km NUMERIC(10, 2) NOT NULL,
  suggested_distance_km NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_unit_suggestions_pending
  ON occurrence_unit_suggestions(occurrence_id, status, created_at DESC);
