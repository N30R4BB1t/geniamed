CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_patients_name_trgm

ON patients

USING gin (
    full_name gin_trgm_ops
);

