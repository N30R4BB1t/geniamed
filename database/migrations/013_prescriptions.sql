CREATE TABLE prescriptions (

    id BIGSERIAL PRIMARY KEY,

    consultation_id BIGINT NOT NULL,

    doctor_id BIGINT NOT NULL,

    observations TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_consultation
        FOREIGN KEY (consultation_id)
        REFERENCES consultations(id),

    CONSTRAINT fk_prescription_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id)

);