const { Pool } = require('pg');

function createPoolConfig() {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production' || env === 'prod';
  const sslEnabled = process.env.DB_SSL === 'true' || isProduction;
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  const common = {
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
    query_timeout: 20000
  };

  if (process.env.DATABASE_URL) {
    return {
      ...common,
      connectionString: process.env.DATABASE_URL,
      ssl: sslEnabled ? { rejectUnauthorized } : false
    };
  }

  return {
    ...common,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'prontuario_mvp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: sslEnabled ? { rejectUnauthorized } : false
  };
}

const pool = new Pool(createPoolConfig());

async function query(text, params) {
  return pool.query(text, params);
}

async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, transaction, close };
