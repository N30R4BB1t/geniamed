CREATE TABLE consultation_cids (

    consultation_id BIGINT NOT NULL,

    cid_id BIGINT NOT NULL,

    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        consultation_id,
        cid_id
    ),

    CONSTRAINT fk_consultation_cid_consultation
        FOREIGN KEY (consultation_id)
        REFERENCES consultations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_consultation_cid
        FOREIGN KEY (cid_id)
        REFERENCES cids(id)

);