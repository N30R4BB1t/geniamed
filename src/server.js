require('dotenv').config();

const app = require('./app');
const { runMigrations } = require('./database/migrate');

const port = process.env.PORT || 3001;

async function startServer() {
  validateProductionConfiguration();
  await runMigrations();

  app.listen(port, () => {
    console.log(`API do prontuario executando em http://localhost:${port}`);
  });
}

function validateProductionConfiguration() {
  if (!['production', 'prod'].includes(process.env.NODE_ENV)) return;
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new Error('AUTH_SECRET deve possuir pelo menos 32 caracteres em producao.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL e obrigatoria em producao.');
  }
}

startServer().catch((error) => {
  console.error('Erro ao iniciar servidor:', error.message);
  process.exit(1);
});
