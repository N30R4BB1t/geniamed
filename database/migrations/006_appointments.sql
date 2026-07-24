CREATE TABLE appointments (

    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    professional_id BIGINT NOT NULL,

    scheduled_at TIMESTAMP NOT NULL,

    appointment_type VARCHAR(50),

    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADO',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id),

    CONSTRAINT fk_appointment_professional
        FOREIGN KEY (professional_id)
        REFERENCES users(id)

);