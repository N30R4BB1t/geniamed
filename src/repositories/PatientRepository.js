const db = require('../config/database');

class PatientRepository {

    async create(patient) {

        const query = `
            INSERT INTO patients (

                full_name,
                social_name,
                cpf,
                rg,
                sus_card,

                birth_date,
                gender,
                marital_status,
                occupation,

                phone,
                email,

                address_street,
                address_number,
                address_complement,
                address_district,
                address_city,
                address_state,
                address_zipcode,

                blood_type,
                allergies

            )

            VALUES (

                $1,$2,$3,$4,$5,
                $6,$7,$8,$9,
                $10,$11,
                $12,$13,$14,$15,$16,$17,$18,
                $19,$20

            )

            RETURNING *
        `;

        const values = [

            patient.full_name,
            patient.social_name,
            patient.cpf,
            patient.rg,
            patient.sus_card,

            patient.birth_date,
            patient.gender,
            patient.marital_status,
            patient.occupation,

            patient.phone,
            patient.email,

            patient.address_street,
            patient.address_number,
            patient.address_complement,
            patient.address_district,
            patient.address_city,
            patient.address_state,
            patient.address_zipcode,

            patient.blood_type,
            patient.allergies
        ];

        const { rows } =
            await db.query(query, values);

        return rows[0];
    }

    async findById(id) {

        const query = `
            SELECT *
            FROM patients
            WHERE id = $1
            LIMIT 1
        `;

        const { rows } =
            await db.query(query, [id]);

        return rows[0] || null;
    }

    async findByCpf(cpf) {

        const query = `
            SELECT *
            FROM patients
            WHERE cpf = $1
            LIMIT 1
        `;

        const { rows } =
            await db.query(query, [cpf]);

        return rows[0] || null;
    }

    async findAll() {

        const query = `
            SELECT *
            FROM patients
            WHERE active = TRUE
            ORDER BY full_name
        `;

        const { rows } =
            await db.query(query);

        return rows;
    }

    async update(id, patient) {

        const query = `
            UPDATE patients

            SET

                full_name = $1,
                social_name = $2,
                phone = $3,
                email = $4,

                address_street = $5,
                address_number = $6,
                address_complement = $7,
                address_district = $8,
                address_city = $9,
                address_state = $10,
                address_zipcode = $11,

                blood_type = $12,
                allergies = $13

            WHERE id = $14

            RETURNING *
        `;

        const values = [

            patient.full_name,
            patient.social_name,
            patient.phone,
            patient.email,

            patient.address_street,
            patient.address_number,
            patient.address_complement,
            patient.address_district,
            patient.address_city,
            patient.address_state,
            patient.address_zipcode,

            patient.blood_type,
            patient.allergies,

            id
        ];

        const { rows } =
            await db.query(query, values);

        return rows[0];
    }

    async deactivate(id) {

        const query = `
            UPDATE patients

            SET active = FALSE

            WHERE id = $1
        `;

        await db.query(query, [id]);
    }

    async search(filters) {

        const page =
            Number(filters.page || 1);

        const limit =
            Number(filters.limit || 20);

        const offset =
            (page - 1) * limit;

        const params = [];

        let where =
            'WHERE active = TRUE';

        if (filters.name) {

            params.push(
                `%${filters.name}%`
            );

            where += `
            AND full_name
            ILIKE $${params.length}
        `;
        }

        if (filters.cpf) {

            params.push(
                filters.cpf
            );

            where += `
            AND cpf =
            $${params.length}
        `;
        }

        const countQuery = `
        SELECT COUNT(*) AS total
        FROM patients
        ${where}
    `;

        const countResult =
            await db.query(
                countQuery,
                params
            );

        const total =
            Number(
                countResult.rows[0].total
            );

        params.push(limit);
        params.push(offset);

        const query = `
        SELECT *

        FROM patients

        ${where}

        ORDER BY full_name

        LIMIT $${params.length - 1}
        OFFSET $${params.length}
    `;

        const { rows } =
            await db.query(
                query,
                params
            );

        return {

            data: rows,

            pagination: {

                page,

                limit,

                total,

                totalPages:
                    Math.ceil(
                        total / limit
                    )

            }

        };

    }

    async getHistory(patientId) {

        const patientQuery = `
        SELECT *
        FROM patients
        WHERE id = $1
        LIMIT 1
    `;

        const appointmentsQuery = `
        SELECT *
        FROM appointments
        WHERE patient_id = $1
        ORDER BY appointment_date DESC
    `;

        const triagesQuery = `
        SELECT *
        FROM triages
        WHERE patient_id = $1
        ORDER BY created_at DESC
    `;

        const anamnesesQuery = `
        SELECT *
        FROM anamneses
        WHERE patient_id = $1
        ORDER BY created_at DESC
    `;

        const consultationsQuery = `
    SELECT

        c.*,

        u.full_name AS doctor_name,

        COALESCE(

            json_agg(

                json_build_object(

                    'code', cid.code,
                    'description', cid.description

                )

            ) FILTER (
                WHERE cid.id IS NOT NULL
            ),

            '[]'

        ) AS cids

    FROM consultations c

    LEFT JOIN users u
        ON u.id = c.doctor_id

    LEFT JOIN consultation_cids cc
        ON cc.consultation_id = c.id

    LEFT JOIN cids cid
        ON cid.id = cc.cid_id

    WHERE c.patient_id = $1

    GROUP BY
        c.id,
        u.full_name

    ORDER BY c.created_at DESC
`;

        const evolutionsQuery = `
        SELECT *
        FROM medical_evolutions
        WHERE patient_id = $1
        ORDER BY created_at DESC
    `;

        const prescriptionsQuery = `
        SELECT *
        FROM prescriptions
        WHERE patient_id = $1
        ORDER BY created_at DESC
    `;

        const attachmentsQuery = `
        SELECT *
        FROM attachments
        WHERE patient_id = $1
        ORDER BY created_at DESC
    `;

        const [

            patient,

            appointments,

            triages,

            anamneses,

            consultations,

            evolutions,

            prescriptions,

            attachments

        ] = await Promise.all([

            db.query(patientQuery, [patientId]),

            db.query(appointmentsQuery, [patientId]),

            db.query(triagesQuery, [patientId]),

            db.query(anamnesesQuery, [patientId]),

            db.query(consultationsQuery, [patientId]),

            db.query(evolutionsQuery, [patientId]),

            db.query(prescriptionsQuery, [patientId]),

            db.query(attachmentsQuery, [patientId])

        ]);

        return {

            patient:
                patient.rows[0] || null,

            appointments:
                appointments.rows,

            triages:
                triages.rows,

            anamneses:
                anamneses.rows,

            consultations:
                consultations.rows,

            evolutions:
                evolutions.rows,

            prescriptions:
                prescriptions.rows,

            attachments:
                attachments.rows

        };

    }

    async searchSummary(filters) {

    const page =
        Number(filters.page || 1);

    const limit =
        Number(filters.limit || 20);

    const offset =
        (page - 1) * limit;

    const params = [];

    let where = 'WHERE 1=1';

    if (filters.name) {

        params.push(
            `%${filters.name}%`
        );

        where += `
            AND full_name
            ILIKE $${params.length}
        `;
    }

    if (filters.cpf) {

        params.push(filters.cpf);

        where += `
            AND cpf =
            $${params.length}
        `;
    }

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM vw_patient_summary
        ${where}
    `;

    const count =
        await db.query(
            countQuery,
            params
        );

    const total =
        Number(
            count.rows[0].total
        );

    params.push(limit);
    params.push(offset);

    const query = `
        SELECT *

        FROM vw_patient_summary

        ${where}

        ORDER BY full_name

        LIMIT $${params.length - 1}

        OFFSET $${params.length}
    `;

    const { rows } =
        await db.query(
            query,
            params
        );

    return {

        data: rows,

        pagination: {

            page,

            limit,

            total,

            totalPages:
                Math.ceil(
                    total / limit
                )

        }

    };
}

}

module.exports =
    new PatientRepository();