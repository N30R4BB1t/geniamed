const db =
    require('../config/database');

class ConsultationCidRepository {

    async replaceCids(
        consultationId,
        cidIds
    ) {

        await db.query(
            `
            DELETE FROM consultation_cids

            WHERE consultation_id = $1
            `,
            [consultationId]
        );

        for (const cidId of cidIds) {

            await db.query(
                `
                INSERT INTO consultation_cids (

                    consultation_id,
                    cid_id

                )

                VALUES ($1,$2)
                `,
                [
                    consultationId,
                    cidId
                ]
            );

        }

    }

    async findByConsultation(
        consultationId
    ) {

        const { rows } =
            await db.query(
                `
                SELECT

                    c.id,
                    c.code,
                    c.description

                FROM consultation_cids cc

                INNER JOIN cids c

                    ON c.id = cc.cid_id

                WHERE cc.consultation_id = $1

                ORDER BY c.code
                `,
                [consultationId]
            );

        return rows;
    }

}

module.exports =
    new ConsultationCidRepository();