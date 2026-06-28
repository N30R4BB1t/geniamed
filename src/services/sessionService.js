const crypto = require('crypto');
const db = require('../config/database');

const SESSION_COOKIE = 'geniamed_session';
const SESSION_HOURS = 8;

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch (error) {
        cookies[name] = value;
      }
    }
    return cookies;
  }, {});
}

async function createSession(user, req) {
  const token = randomToken();
  const csrfToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  const result = await db.query(
    `INSERT INTO user_sessions
      (user_id, token_hash, csrf_token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      user.id,
      hash(token),
      hash(csrfToken),
      requestIp(req),
      String(req.headers['user-agent'] || '').slice(0, 500),
      expiresAt
    ]
  );

  return { id: result.rows[0].id, token, csrfToken, expiresAt };
}

async function findSession(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;

  const result = await db.query(
    `SELECT s.id AS session_id, s.csrf_token_hash, s.expires_at,
            u.id, u.username, u.full_name, u.role, u.active, u.must_change_password
       FROM user_sessions s
       JOIN app_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.active = TRUE`,
    [hash(token)]
  );

  if (result.rowCount === 0) return null;
  const session = result.rows[0];

  await db.query(
    `UPDATE user_sessions
        SET last_seen_at = now()
      WHERE id = $1
        AND last_seen_at < now() - interval '5 minutes'`,
    [session.session_id]
  );

  return session;
}

async function revokeSession(sessionId) {
  if (!sessionId) return;
  await db.query(
    'UPDATE user_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL',
    [sessionId]
  );
}

async function revokeUserSessions(userId, exceptSessionId = null) {
  await db.query(
    `UPDATE user_sessions
        SET revoked_at = now()
      WHERE user_id = $1
        AND revoked_at IS NULL
        AND ($2::uuid IS NULL OR id <> $2)`,
    [userId, exceptSessionId]
  );
}

async function rotateCsrf(sessionId) {
  const csrfToken = randomToken();
  await db.query(
    'UPDATE user_sessions SET csrf_token_hash = $1 WHERE id = $2',
    [hash(csrfToken), sessionId]
  );
  return csrfToken;
}

function setSessionCookie(res, token) {
  const secure = isProduction();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60 * 1000
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'strict',
    path: '/'
  });
}

function verifyCsrf(session, token) {
  if (!session || !token) return false;
  const received = Buffer.from(hash(token));
  const expected = Buffer.from(session.csrf_token_hash);
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function requestIp(req) {
  return String(req.ip || req.socket?.remoteAddress || '').slice(0, 64);
}

function isProduction() {
  return ['production', 'prod'].includes(process.env.NODE_ENV);
}

module.exports = {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  findSession,
  hash,
  requestIp,
  rotateCsrf,
  revokeSession,
  revokeUserSessions,
  setSessionCookie,
  verifyCsrf
};
