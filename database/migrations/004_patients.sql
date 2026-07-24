CREATE TABLE patients (

    id BIGSERIAL PRIMARY KEY,

    full_name VARCHAR(200) NOT NULL,

    social_name VARCHAR(200),

    cpf VARCHAR(14) UNIQUE,

    rg VARCHAR(20),

    sus_card VARCHAR(30),

    birth_date DATE NOT NULL,

    gender VARCHAR(20),

    marital_status VARCHAR(50),

    occupation VARCHAR(150),

    phone VARCHAR(20),

    email VARCHAR(150),

    address_street VARCHAR(255),

    address_number VARCHAR(20),

    address_complement VARCHAR(100),

    address_district VARCHAR(100),

    address_city VARCHAR(100),

    address_state VARCHAR(50),

    address_zipcode VARCHAR(20),

    blood_type VARCHAR(3),

    allergies TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);