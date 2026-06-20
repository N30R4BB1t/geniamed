const crypto = require('crypto');

const secret = process.env.AUTH_SECRET || 'dev-secret-change-me';

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;

  const [body, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', secret)
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
