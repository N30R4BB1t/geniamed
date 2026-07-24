ALTER TABLE anamneses

ADD COLUMN template_id INTEGER;

ALTER TABLE anamneses

ADD CONSTRAINT fk_anamnese_template

FOREIGN KEY (
    template_id
)

REFERENCES anamnese_templates(id);