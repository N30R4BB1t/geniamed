const db = require('../config/database');

class TriageRepository {

    async create(data) {

        const query = `
            INSERT INTO triages (

                patient_id,
                appointment_id,
                nurse_id,

                weight,
                height,
                bmi,

                temperature,
                heart_rate,
                respiratory_rate,
                oxygen_saturation,

                blood_pressure,
                glucose_level,

                pain_scale,

                risk_classification_id,

                chief_complaint,
                observations

            )

            VALUES (

                $1,$2,$3,
                $4,$5,$6,
                $7,$8,$9,$10,
                $11,$12,
                $13,
                $14,
                $15,$16

            )

            RETURNING *
        `;

        const values = [

            data.patient_id,
            data.appointment_id,
            data.nurse_id,

            data.weight,
            data.height,
            data.bmi,

            data.temperature,
            data.heart_rate,
            data.respiratory_rate,
            data.oxygen_saturation,

            data.blood_pressure,
            data.glucose_level,

            data.pain_scale,

            //data.risk_classification,
            data.risk_classification_id,

            data.chief_complaint,
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

                t.*,

                rc.code,
                rc.name,
                rc.priority,
                rc.max_wait_minutes

            FROM triages t

            LEFT JOIN risk_classifications rc

                ON rc.id =
                   t.risk_classification_id

            WHERE t.id = $1
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

                t.*,

                rc.code,
                rc.name,
                rc.priority,
                rc.max_wait_minutes

            FROM triages t

            LEFT JOIN risk_classifications rc

                ON rc.id =
                   t.risk_classification_id

            WHERE t.patient_id = $1

            ORDER BY t.created_at DESC
            `,
            [patientId]
        );

    return rows;
}

}