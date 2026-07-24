CREATE TABLE prescription_items (

    id BIGSERIAL PRIMARY KEY,

    prescription_id BIGINT NOT NULL,

    medication_name VARCHAR(255) NOT NULL,

    dosage VARCHAR(100),

    frequency VARCHAR(100),

    duration VARCHAR(100),

    instructions TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_item
        FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(id)
        ON DELETE CASCADE

);