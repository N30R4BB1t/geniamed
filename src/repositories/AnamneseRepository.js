const db =
    require('../config/database');

class AnamneseRepository {

    async create(data) {

        const query = `
            INSERT INTO anamneses (

                patient_id,
                appointment_id,
                doctor_id,
                triage_id,
                template_id,

                chief_complaint,

                history_present_illness,

                personal_history,

                family_history,

                medication_history,

                allergy_history,

                social_history,

                review_of_systems,

                observations

            )

            VALUES (

                $1,$2,$3,$4,$5,
                $6,$7,$8,$9,$10,
                $11,$12,$13,$14

            )

            RETURNING *
        `;

        const values = [

            data.patient_id,
            data.appointment_id,
            data.doctor_id,
            data.triage_id,
            data.template_id,

            data.chief_complaint,

            data.history_present_illness,

            data.personal_history,

            data.family_history,

            data.medication_history,

            data.allergy_history,

            data.social_history,

            data.review_of_systems,

            data.observations
        ];

        const { rows } =
            await db.query(query, values);

        return rows[0];
    }

    async update(id, data) {

        const query = `
            UPDATE anamneses

            SET

                template_id = $2,

                chief_complaint = $3,

                history_present_illness = $4,

                personal_history = $5,

                family_history = $6,

                medication_history = $7,

                allergy_history = $8,

                social_history = $9,

                review_of_systems = $10,

                observations = $11,

                updated_at = NOW()

            WHERE id = $1

            RETURNING *
        `;

        const values = [

            id,

            data.template_id,

            data.chief_complaint,

            data.history_present_illness,

            data.personal_history,

            data.family_history,

            data.medication_history,

            data.allergy_history,

            data.social_history,

            data.review_of_systems,

            data.observations
        ];

        const { rows } =
            await db.query(query, values);

        return rows[0];
    }

    async findById(id) {

        const { rows } =
            await db.query(
                `
                SELECT

                    a.*,

                    u.full_name AS doctor_name,

                    t.name AS template_name

                FROM anamneses a

                LEFT JOIN users u
                    ON u.id = a.doctor_id

                LEFT JOIN anamnese_templates t
                    ON t.id = a.template_id

                WHERE a.id = $1
                `,
                [id]
            );

        return rows[0] || null;
    }

    async findByPatient(patientId) {

        const { rows } =
            await db.query(
                `
                SELECT

                    a.*,

                    u.full_name AS doctor_name

                FROM anamneses a

                LEFT JOIN users u
                    ON u.id = a.doctor_id

                WHERE a.patient_id = $1

                ORDER BY a.created_at DESC
                `,
                [patientId]
            );

        return rows;
    }

    async history(patientId) {

        const { rows } =
            await db.query(
                `
                SELECT

                    a.id,

                    a.created_at,

                    a.chief_complaint,

                    u.full_name AS doctor_name,

                    t.name AS template_name

                FROM anamneses a

                LEFT JOIN users u
                    ON u.id = a.doctor_id

                LEFT JOIN anamnese_templates t
                    ON t.id = a.template_id

                WHERE a.patient_id = $1

                ORDER BY a.created_at DESC
                `,
                [patientId]
            );

        return rows;
    }

}

module.exports =
    new AnamneseRepository();