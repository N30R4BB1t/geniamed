CREATE TABLE anamneses (

    id SERIAL PRIMARY KEY,

    patient_id INTEGER NOT NULL,

    appointment_id INTEGER,

    doctor_id INTEGER NOT NULL,

    triage_id INTEGER,

    chief_complaint TEXT NOT NULL,

    history_present_illness TEXT,

    personal_history TEXT,

    family_history TEXT,

    medication_history TEXT,

    allergy_history TEXT,

    social_history TEXT,

    review_of_systems TEXT,

    observations TEXT,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anamnese_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id),

    CONSTRAINT fk_anamnese_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id),

    CONSTRAINT fk_anamnese_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id),

    CONSTRAINT fk_anamnese_triage
        FOREIGN KEY (triage_id)
        REFERENCES triages(id)
);