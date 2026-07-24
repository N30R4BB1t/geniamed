const db =
    require('../config/database');

class CidRepository {

    async findById(id) {

        const { rows } =
            await db.query(
                `
                SELECT *

                FROM cids

                WHERE id = $1
                `,
                [id]
            );

        return rows[0] || null;
    }

}

module.exports =
    new CidRepository();