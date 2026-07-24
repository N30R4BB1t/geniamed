CREATE TABLE audit_logs (

    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    action VARCHAR(100) NOT NULL,

    table_name VARCHAR(100) NOT NULL,

    record_id BIGINT,

    old_data JSONB,

    new_data JSONB,

    ip_address VARCHAR(45),

    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)

);

ALTER TABLE audit_logs
ADD COLUMN application_user_id BIGINT;