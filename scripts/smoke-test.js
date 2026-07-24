require('dotenv').config();

const app = require('../src/app');
const db = require('../src/config/db');

async function main() {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await check('/', 200, { contains: 'Dashboard de Ocorrencias' });
    await check('/index.html', 302, { location: '/' });
    await check('/styles.css', 200, { contentType: 'text/css' });
    await check('/auth/login', 404);
    await check('/api/auth/me', 401);
    await check('/api/patients', 401);
    await check('/prontuario.html', 200, { contains: 'Prontuario Eletronico' });
    await check('/admin.html', 200, { contains: 'Area Administrativa' });
    await check('/dashboard.js', 200, { contentType: 'javascript' });
    await check('/auth-client.js', 200, { contentType: 'javascript' });

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '__smoke_test_invalid__', password: 'invalid' }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5000)
    });
    assert(loginResponse.status === 401, `/api/auth/login retornou ${loginResponse.status}, esperado 401`);

    console.log('Smoke test finalizado: páginas, assets e rotas principais estão consistentes.');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await db.close();
  }

  async function check(path, expectedStatus, expected = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000)
    });
    assert(response.status === expectedStatus, `${path} retornou ${response.status}, esperado ${expectedStatus}`);

    if (expected.location) {
      assert(response.headers.get('location') === expected.location, `${path} não redirecionou para ${expected.location}`);
    }

    if (expected.contentType) {
      const contentType = response.headers.get('content-type') || '';
      assert(contentType.includes(expected.contentType), `${path} retornou Content-Type ${contentType}`);
    }

    if (expected.contains) {
      const body = await response.text();
      assert(body.includes(expected.contains), `${path} não contém o conteúdo esperado`);
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(`Smoke test falhou: ${error.message}`);
  process.exitCode = 1;
});
