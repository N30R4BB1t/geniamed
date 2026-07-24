CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE
ON patients
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_patients_prevent_delete
BEFORE DELETE
ON patients
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_patient_delete();

CREATE TRIGGER trg_patients_audit
AFTER INSERT OR UPDATE OR DELETE
ON patients
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();


CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE
ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_users_audit
AFTER INSERT OR UPDATE
ON users
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();


CREATE TRIGGER trg_appointments_validate_date
BEFORE INSERT OR UPDATE
ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_validate_appointment_date();

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE
ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_appointments_audit
AFTER INSERT OR UPDATE
ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();


CREATE TRIGGER trg_triages_updated_at
BEFORE UPDATE
ON triages
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_triages_audit
AFTER INSERT OR UPDATE
ON triages
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_anamneses_prevent_delete
BEFORE DELETE
ON anamneses
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_anamnese_delete();

CREATE TRIGGER trg_anamneses_updated_at
BEFORE UPDATE
ON anamneses
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_anamneses_audit
AFTER INSERT OR UPDATE
ON anamneses
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_consultations_prevent_delete
BEFORE DELETE
ON consultations
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_consultation_delete();

CREATE TRIGGER trg_consultations_updated_at
BEFORE UPDATE
ON consultations
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_consultations_audit
AFTER INSERT OR UPDATE
ON consultations
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

