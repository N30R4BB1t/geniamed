CREATE TABLE IF NOT EXISTS symptom_cid10_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id UUID NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  cid10_id UUID NOT NULL REFERENCES cid10_codes(id) ON DELETE CASCADE,
  suggested_score INTEGER NOT NULL DEFAULT 2,
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  origin VARCHAR(60) NOT NULL DEFAULT 'AUTO_KEYWORD',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  reviewed_by VARCHAR(120),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symptom_id, cid10_id)
);

CREATE INDEX IF NOT EXISTS idx_symptom_cid10_candidates_status ON symptom_cid10_candidates(status, created_at DESC);

CREATE TABLE IF NOT EXISTS symptom_combination_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  symptom_ids UUID[] NOT NULL,
  cid10_id UUID NOT NULL REFERENCES cid10_codes(id) ON DELETE CASCADE,
  score_bonus INTEGER NOT NULL DEFAULT 10,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_combination_rules_active ON symptom_combination_rules(active);
