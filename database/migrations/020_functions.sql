CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER
AS $$
BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validate_appointment_date()
RETURNS TRIGGER
AS $$
BEGIN

    IF NEW.scheduled_at < CURRENT_TIMESTAMP THEN

        RAISE EXCEPTION
            'Não é permitido criar agendamentos em datas passadas';

    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_prevent_patient_delete()
RETURNS TRIGGER
AS $$
BEGIN

    RAISE EXCEPTION
        'Exclusão física de pacientes não é permitida';

    RETURN OLD;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_prevent_consultation_delete()
RETURNS TRIGGER
AS $$
BEGIN

    RAISE EXCEPTION
        'Consultas médicas não podem ser removidas';

    RETURN OLD;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_prevent_anamnese_delete()
RETURNS TRIGGER
AS $$
BEGIN

    RAISE EXCEPTION
        'Anamneses não podem ser removidas';

    RETURN OLD;

END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
AS $$
BEGIN

    IF TG_OP = 'INSERT' THEN

        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            new_data,
            created_at
        )
        VALUES (
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW),
            CURRENT_TIMESTAMP
        );

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN

        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            old_data,
            new_data,
            created_at
        )
        VALUES (
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            CURRENT_TIMESTAMP
        );

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN

        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            old_data,
            created_at
        )
        VALUES (
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            CURRENT_TIMESTAMP
        );

        RETURN OLD;

    END IF;

    RETURN NULL;

END;
$$ LANGUAGE plpgsql;