const db = require('../config/database');

class BaseModel {

    constructor(table) {
        this.table = table;
    }

    async findAll() {

        const query = `
            SELECT *
            FROM ${this.table}
            WHERE active = TRUE
            ORDER BY id
        `;

        const { rows } = await db.query(query);

        return rows;
    }

    async findById(id) {

        const query = `
            SELECT *
            FROM ${this.table}
            WHERE id = $1
            LIMIT 1
        `;

        const { rows } = await db.query(query, [id]);

        return rows[0] || null;
    }

    async softDelete(id) {

        const query = `
            UPDATE ${this.table}
            SET active = FALSE
            WHERE id = $1
        `;

        await db.query(query, [id]);
    }

}

module.exports = BaseModel;