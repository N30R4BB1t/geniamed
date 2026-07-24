CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_patients_cpf
ON patients(cpf);

CREATE INDEX idx_patients_name
ON patients(full_name);

CREATE INDEX idx_appointments_patient
ON appointments(patient_id);

CREATE INDEX idx_triages_patient
ON triages(patient_id);

CREATE INDEX idx_anamneses_patient
ON anamneses(patient_id);

CREATE INDEX idx_consultations_patient
ON consultations(patient_id);

CREATE INDEX idx_cids_code
ON cids(code);

CREATE INDEX idx_attachments_patient
ON attachments(patient_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);