require('dotenv').config();

const app = require('./app');
const { runMigrations } = require('./database/migrate');

const port = process.env.PORT || 3000;

async function startServer() {
  await runMigrations();

  app.listen(port, () => {
    console.log(`API do prontuario executando em http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Erro ao iniciar servidor:', error.message);
  process.exit(1);
});
