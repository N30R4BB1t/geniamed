CREATE TABLE medical_evolutions (

    id BIGSERIAL PRIMARY KEY,

    consultation_id BIGINT NOT NULL,

    professional_id BIGINT NOT NULL,

    evolution_text TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_evolution_consultation
        FOREIGN KEY (consultation_id)
        REFERENCES consultations(id),

    CONSTRAINT fk_evolution_professional
        FOREIGN KEY (professional_id)
        REFERENCES users(id)

);
