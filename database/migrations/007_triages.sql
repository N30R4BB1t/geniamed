CREATE TABLE triages (

    id BIGSERIAL PRIMARY KEY,

    appointment_id BIGINT NOT NULL,

    patient_id BIGINT NOT NULL,

    professional_id BIGINT NOT NULL,

    weight DECIMAL(5,2),

    height DECIMAL(4,2),

    bmi DECIMAL(5,2),

    temperature DECIMAL(4,1),

    heart_rate INTEGER,

    respiratory_rate INTEGER,

    oxygen_saturation INTEGER,

    systolic_pressure INTEGER,

    diastolic_pressure INTEGER,

    pain_scale INTEGER,

    risk_classification VARCHAR(20),

    chief_complaint TEXT,

    observations TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_triage_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id),

    CONSTRAINT fk_triage_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id),

    CONSTRAINT fk_triage_professional
        FOREIGN KEY (professional_id)
        REFERENCES users(id)

);

-- -- tabela triagens prevista

-- CREATE TABLE triages (

--     id SERIAL PRIMARY KEY,

--     patient_id INTEGER NOT NULL,

--     appointment_id INTEGER,

--     nurse_id INTEGER NOT NULL,

--     weight NUMERIC(5,2),

--     height NUMERIC(4,2),

--     bmi NUMERIC(5,2),

--     temperature NUMERIC(4,1),

--     heart_rate INTEGER,

--     respiratory_rate INTEGER,

--     oxygen_saturation INTEGER,

--     blood_pressure VARCHAR(20),

--     glucose_level NUMERIC(6,2),

--     pain_scale INTEGER,

--     risk_classification VARCHAR(30),

--     chief_complaint TEXT,

--     observations TEXT,

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT fk_triage_patient
--         FOREIGN KEY (patient_id)
--         REFERENCES patients(id),

--     CONSTRAINT fk_triage_appointment
--         FOREIGN KEY (appointment_id)
--         REFERENCES appointments(id),

--     CONSTRAINT fk_triage_nurse
--         FOREIGN KEY (nurse_id)
--         REFERENCES users(id)
-- );