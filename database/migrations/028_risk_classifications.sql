CREATE TABLE risk_classifications (

    id SERIAL PRIMARY KEY,

    code VARCHAR(20) NOT NULL UNIQUE,

    name VARCHAR(50) NOT NULL,

    priority INTEGER NOT NULL,

    max_wait_minutes INTEGER,

    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP

);