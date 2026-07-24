CREATE TABLE users (

    id BIGSERIAL PRIMARY KEY,

    role_id INTEGER NOT NULL,

    specialty_id INTEGER,

    full_name VARCHAR(200) NOT NULL,

    cpf VARCHAR(14) UNIQUE,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    professional_register VARCHAR(50),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT fk_user_specialty
        FOREIGN KEY (specialty_id)
        REFERENCES specialties(id)

);