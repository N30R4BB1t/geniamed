const db =
    require('../config/database');

class RiskClassificationRepository {

    async findAll() {

        const { rows } =
            await db.query(
                `
                SELECT *

                FROM risk_classifications

                WHERE active = TRUE

                ORDER BY priority
                `
            );

        return rows;
    }

    async findById(id) {

        const { rows } =
            await db.query(
                `
                SELECT *

                FROM risk_classifications

                WHERE id = $1

                LIMIT 1
                `,
                [id]
            );

        return rows[0] || null;
    }

}

module.exports =
    new RiskClassificationRepository();