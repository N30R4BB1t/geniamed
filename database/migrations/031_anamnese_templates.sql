CREATE TABLE anamnese_templates (

    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    specialty VARCHAR(100),

    chief_complaint_template TEXT,

    history_present_illness_template TEXT,

    personal_history_template TEXT,

    family_history_template TEXT,

    medication_history_template TEXT,

    allergy_history_template TEXT,

    social_history_template TEXT,

    review_of_systems_template TEXT,

    observations_template TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP

);