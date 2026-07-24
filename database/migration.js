require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function runMigrations() {

    const client = await pool.connect();

    let executedCount = 0;

    try {

        console.log('\n=== MIGRATIONS ===\n');

        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationsDir =
            path.join(__dirname, 'migrations');

        const files =
            fs.readdirSync(migrationsDir)
              .filter(file => file.endsWith('.sql'))
              .sort();

        for (const file of files) {

            const alreadyExecuted =
                await client.query(
                    `
                    SELECT 1
                    FROM migrations
                    WHERE file_name = $1
                    `,
                    [file]
                );

            if (alreadyExecuted.rows.length) {

                console.log(`✓ ${file}`);

                continue;
            }

            console.log(`Executando ${file}`);

            const sql =
                fs.readFileSync(
                    path.join(migrationsDir, file),
                    'utf8'
                );

            await client.query('BEGIN');

            await client.query(sql);

            await client.query(
                `
                INSERT INTO migrations
                (file_name)
                VALUES ($1)
                `,
                [file]
            );

            await client.query('COMMIT');

            executedCount++;

            console.log(`✔ ${file}`);
        }

        console.log(
            `\n${executedCount} migration(s) executada(s).\n`
        );

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(
            'Erro nas migrations:',
            error
        );

        throw error;

    } finally {

        client.release();
    }
}

module.exports = runMigrations;

if (require.main === module) {

    runMigrations()
        .then(() => pool.end())
        .catch(() => pool.end());

}