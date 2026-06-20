ALTER TABLE occurrences
  ADD COLUMN IF NOT EXISTS last_eta_alert_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS arrival_alert_sent_at TIMESTAMPTZ;
