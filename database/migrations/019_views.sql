CREATE OR REPLACE VIEW vw_patient_summary AS

SELECT

    p.id,
    p.full_name,
    p.cpf,
    p.birth_date,
    p.gender,
    p.phone,
    p.blood_type,
    p.allergies,
    p.created_at

FROM patients p;

CREATE OR REPLACE VIEW vw_patient_medical_history AS

SELECT

    p.id AS patient_id,

    p.full_name,

    a.id AS appointment_id,

    a.scheduled_at,

    c.id AS consultation_id,

    c.diagnosis,

    c.conduct,

    t.weight,

    t.height,

    t.temperature,

    t.systolic_pressure,

    t.diastolic_pressure,

    an.chief_complaint,

    an.history_present_illness

FROM patients p

INNER JOIN appointments a
    ON a.patient_id = p.id

LEFT JOIN triages t
    ON t.appointment_id = a.id

LEFT JOIN anamneses an
    ON an.appointment_id = a.id

LEFT JOIN consultations c
    ON c.appointment_id = a.id;

CREATE OR REPLACE VIEW vw_doctor_schedule AS

SELECT

    a.id,

    a.scheduled_at,

    a.status,

    p.full_name AS patient_name,

    p.phone,

    u.full_name AS professional_name

FROM appointments a

INNER JOIN patients p
    ON p.id = a.patient_id

INNER JOIN users u
    ON u.id = a.professional_id;

CREATE OR REPLACE VIEW vw_today_appointments AS

SELECT

    a.id,

    a.scheduled_at,

    a.status,

    p.full_name AS patient_name,

    p.phone,

    u.full_name AS professional_name

FROM appointments a

INNER JOIN patients p
    ON p.id = a.patient_id

INNER JOIN users u
    ON u.id = a.professional_id

WHERE DATE(a.scheduled_at) = CURRENT_DATE;

CREATE OR REPLACE VIEW vw_prescriptions AS

SELECT

    pr.id AS prescription_id,

    p.full_name AS patient_name,

    d.full_name AS doctor_name,

    pi.medication_name,

    pi.dosage,

    pi.frequency,

    pi.duration,

    pr.created_at

FROM prescriptions pr

INNER JOIN consultations c
    ON c.id = pr.consultation_id

INNER JOIN patients p
    ON p.id = c.patient_id

INNER JOIN users d
    ON d.id = pr.doctor_id

INNER JOIN prescription_items pi
    ON pi.prescription_id = pr.id;

CREATE OR REPLACE VIEW vw_consultation_cids AS

SELECT

    c.id AS consultation_id,

    p.full_name AS patient_name,

    cid.code,

    cid.description,

    cc.is_primary

FROM consultation_cids cc

INNER JOIN consultations c
    ON c.id = cc.consultation_id

INNER JOIN patients p
    ON p.id = c.patient_id

INNER JOIN cids cid
    ON cid.id = cc.cid_id;