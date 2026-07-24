CREATE TABLE anamneses (

    id BIGSERIAL PRIMARY KEY,

    appointment_id BIGINT NOT NULL,

    patient_id BIGINT NOT NULL,

    doctor_id BIGINT NOT NULL,

    chief_complaint TEXT,

    history_present_illness TEXT,

    past_medical_history TEXT,

    current_medications TEXT,

    allergies TEXT,

    family_history TEXT,

    social_history TEXT,

    review_of_systems TEXT,

    physical_exam TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anamnese_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id),

    CONSTRAINT fk_anamnese_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id),

    CONSTRAINT fk_anamnese_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id)

);