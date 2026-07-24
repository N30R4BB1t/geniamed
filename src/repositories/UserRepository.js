const db = require('../config/database');

class UserRepository {

    async findByEmail(email) {

        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.password_hash,
                u.active,
                r.id AS role_id,
                r.name AS role_name
            FROM users u
            INNER JOIN roles r
                ON r.id = u.role_id
            WHERE u.email = $1
            LIMIT 1
        `;

        const { rows } = await db.query(
            query,
            [email]
        );

        return rows[0] || null;
    }

    async findById(id) {

        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.active,
                r.id AS role_id,
                r.name AS role_name
            FROM users u
            INNER JOIN roles r
                ON r.id = u.role_id
            WHERE u.id = $1
            LIMIT 1
        `;

        const { rows } = await db.query(
            query,
            [id]
        );

        return rows[0] || null;
    }

    async create(user) {

        const query = `
            INSERT INTO users (
                role_id,
                full_name,
                cpf,
                email,
                password_hash
            )
            VALUES (
                $1,$2,$3,$4,$5
            )
            RETURNING id
        `;

        const values = [
            user.role_id,
            user.full_name,
            user.cpf,
            user.email,
            user.password_hash
        ];

        const { rows } =
            await db.query(
                query,
                values
            );

        return rows[0];
    }

}

module.exports = new UserRepository();