require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/db');

const migrationsDir = path.join(__dirname, '..', '..', 'migrations');

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function alreadyExecuted(filename) {
  const result = await db.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1',
    [filename]
  );

  return result.rowCount > 0;
}

async function runMigration(filename) {
  const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');

  await db.transaction(async (client) => {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
  });
}

async function runMigrations() {
  await ensureMigrationsTable();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (await alreadyExecuted(file)) {
      console.log(`OK ${file} ja executada`);
      continue;
    }

    console.log(`Executando ${file}`);
    await runMigration(file);
  }

  console.log('Migrations finalizadas.');
}

if (require.main === module) {
  runMigrations()
    .then(() => db.close())
    .catch(async (error) => {
      console.error('Erro ao executar migrations:', error.message);
      await db.close();
      process.exit(1);
    });
}

module.exports = { runMigrations };
