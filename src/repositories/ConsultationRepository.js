const db =
    require('../config/database');

class ConsultationRepository {

    async create(data) {

        const query = `
            INSERT INTO consultations (

                patient_id,
                appointment_id,
                doctor_id,

                triage_id,
                anamnese_id,

                diagnosis,

                medical_conduct,

                requested_exams,

                medical_certificate,

                referral,

                return_in_days,

                notes

            )

            VALUES (

                $1,$2,$3,
                $4,$5,$6,
                $7,$8,$9,
                $10,$11,$12

            )

            RETURNING *
        `;

        const values = [

            data.patient_id,
            data.appointment_id,
            data.doctor_id,

            data.triage_id,
            data.anamnese_id,

            data.diagnosis,

            data.medical_conduct,

            data.requested_exams,

            data.medical_certificate,

            data.referral,

            data.return_in_days,

            data.notes
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

                    c.*,

                    u.full_name AS doctor_name

                FROM consultations c

                LEFT JOIN users u
                    ON u.id = c.doctor_id

                WHERE c.id = $1
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

                    c.*,

                    u.full_name AS doctor_name

                FROM consultations c

                LEFT JOIN users u
                    ON u.id = c.doctor_id

                WHERE c.patient_id = $1

                ORDER BY c.created_at DESC
                `,
                [patientId]
            );

        return rows;
    }

}

module.exports =
    new ConsultationRepository();