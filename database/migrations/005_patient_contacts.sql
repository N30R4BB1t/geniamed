CREATE TABLE patient_contacts (

    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    full_name VARCHAR(200) NOT NULL,

    relationship VARCHAR(100),

    phone VARCHAR(20),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contact_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE

);