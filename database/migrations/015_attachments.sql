CREATE TABLE attachments (

    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    uploaded_by BIGINT NOT NULL,

    original_name VARCHAR(255) NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    mime_type VARCHAR(100),

    file_size BIGINT,

    file_path TEXT NOT NULL,

    attachment_type VARCHAR(50),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id),

    CONSTRAINT fk_attachment_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)

);