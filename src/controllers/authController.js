const { z } = require('zod');
const db = require('../config/database');
const sessionService = require('../services/sessionService');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1).max(120)
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(120),
  newPassword: z.string()
    .min(12)
    .max(120)
    .regex(/[a-z]/, 'A senha deve conter letra minuscula.')
    .regex(/[A-Z]/, 'A senha deve conter letra maiuscula.')
    .regex(/[0-9]/, 'A senha deve conter numero.')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter caractere especial.')
});

async function login(req, res, next) {
  try {
    const input = loginSchema.parse(req.body);
    const userResult = await db.query(
      `SELECT id, username, full_name, role, active, must_change_password,
              failed_login_attempts, locked_until
         FROM app_users
        WHERE LOWER(username) = LOWER($1)`,
      [input.username]
    );

    const user = userResult.rows[0];
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuario ou senha invalidos.' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Usuario temporariamente bloqueado. Tente novamente mais tarde.' });
    }

    const passwordResult = await db.query(
      `SELECT password_hash = crypt($2, password_hash) AS valid
         FROM app_users
        WHERE id = $1`,
      [user.id, input.password]
    );

    if (!passwordResult.rows[0]?.valid) {
      await db.query(
        `UPDATE app_users
            SET failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE
                  WHEN failed_login_attempts + 1 >= 5 THEN now() + interval '15 minutes'
                  ELSE locked_until
                END
          WHERE id = $1`,
        [user.id]
      );
      return res.status(401).json({ error: 'Usuario ou senha invalidos.' });
    }

    await db.query(
      `UPDATE app_users
          SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now()
        WHERE id = $1`,
      [user.id]
    );

    const session = await sessionService.createSession(user, req);
    sessionService.setSessionCookie(res, session.token);

    await db.query(
      `INSERT INTO audit_logs
        (user_id, actor, action, entity, entity_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, 'LOGIN', 'app_users', $1, $3, $4, $5)`,
      [
        user.id,
        user.username,
        JSON.stringify({ role: user.role }),
        sessionService.requestIp(req),
        String(req.headers['user-agent'] || '').slice(0, 500)
      ]
    );

    res.json({
      user: publicUser(user),
      csrfToken: session.csrfToken,
      mustChangePassword: user.must_change_password
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const csrfToken = await sessionService.rotateCsrf(req.user.session_id);
  res.json({
    user: publicUser(req.user),
    mustChangePassword: req.user.must_change_password,
    csrfToken
  });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await sessionService.revokeSession(req.user?.session_id);
    sessionService.clearSessionCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const input = passwordSchema.parse(req.body);
    const result = await db.query(
      `UPDATE app_users
          SET password_hash = crypt($1, gen_salt('bf')),
              must_change_password = FALSE,
              password_changed_at = now(),
              updated_at = now()
        WHERE id = $2
          AND password_hash = crypt($3, password_hash)
        RETURNING id`,
      [input.newPassword, req.user.id, input.currentPassword]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'A senha atual esta incorreta.' });
    }

    await sessionService.revokeUserSessions(req.user.id, req.user.session_id);
    await db.query(
      `INSERT INTO audit_logs
        (user_id, actor, action, entity, entity_id, ip_address, user_agent)
       VALUES ($1, $2, 'PASSWORD_CHANGE', 'app_users', $1, $3, $4)`,
      [
        req.user.id,
        req.user.username,
        sessionService.requestIp(req),
        String(req.headers['user-agent'] || '').slice(0, 500)
      ]
    );
    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    next(error);
  }
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role
  };
}

module.exports = { changePassword, login, logout, me };
