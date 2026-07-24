const db =
    require('../config/database');

class AnamneseTemplateRepository {

    async findAll() {

        const { rows } =
            await db.query(`
                SELECT *

                FROM anamnese_templates

                WHERE active = TRUE

                ORDER BY name
            `);

        return rows;
    }

    async findById(id) {

        const { rows } =
            await db.query(
                `
                SELECT *

                FROM anamnese_templates

                WHERE id = $1
                `,
                [id]
            );

        return rows[0] || null;
    }

}

module.exports =
    new AnamneseTemplateRepository();