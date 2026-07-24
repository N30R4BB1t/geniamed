const bcrypt = require('bcrypt');
const db = require('../src/config/database');

async function createAdmin() {

    const exists = await db.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
        `,
        [process.env.ADMIN_EMAIL]
    );

    if (exists.rows.length) {

        console.log(
            'Administrador já existe.'
        );

        return;
    }

    const hash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        10
    );

    await db.query(
        `
        INSERT INTO users (
            role_id,
            full_name,
            email,
            password_hash
        )

        SELECT
            r.id,
            $1,
            $2,
            $3

        FROM roles r

        WHERE r.name = 'ADMIN'
        `,
        [
            process.env.ADMIN_NAME,
            process.env.ADMIN_EMAIL,
            hash
        ]
    );

    console.log(
        'Administrador criado.'
    );
}

module.exports = createAdmin;