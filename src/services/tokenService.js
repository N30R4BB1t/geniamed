const crypto = require('crypto');

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  const production = ['production', 'prod'].includes(process.env.NODE_ENV);
  if (production && (!secret || secret.length < 32)) {
    throw new Error('AUTH_SECRET deve possuir pelo menos 32 caracteres em producao.');
  }
  return secret || 'development-only-secret-change-before-production';
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(body)
    .digest('base64url');

  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

module.exports = { sign, verify };
