CREATE TABLE consultations (

    id BIGSERIAL PRIMARY KEY,

    appointment_id BIGINT NOT NULL,

    patient_id BIGINT NOT NULL,

    doctor_id BIGINT NOT NULL,

    anamnese_id BIGINT,

    triage_id BIGINT,

    diagnosis TEXT,

    conduct TEXT,

    treatment_plan TEXT,

    return_date DATE,

    consultation_status VARCHAR(30)
        DEFAULT 'EM_ATENDIMENTO',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consultation_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id),

    CONSTRAINT fk_consultation_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id),

    CONSTRAINT fk_consultation_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id),

    CONSTRAINT fk_consultation_anamnese
        FOREIGN KEY (anamnese_id)
        REFERENCES anamneses(id),

    CONSTRAINT fk_consultation_triage
        FOREIGN KEY (triage_id)
        REFERENCES triages(id)

);