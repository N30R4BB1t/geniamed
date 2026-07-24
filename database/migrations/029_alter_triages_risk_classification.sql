ALTER TABLE triages

ADD COLUMN risk_classification_id INTEGER;

ALTER TABLE triages

ADD CONSTRAINT fk_triage_risk_classification

FOREIGN KEY (
    risk_classification_id
)

REFERENCES risk_classifications(id);

ALTER TABLE triages

DROP COLUMN risk_classification;