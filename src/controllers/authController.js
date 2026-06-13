const { z } = require('zod');
const db = require('../config/database');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

async function login(req, res, next) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await db.query(
      `SELECT id, username, full_name, role, active
         FROM app_users
        WHERE LOWER(username) = LOWER($1)
          AND password_hash = crypt($2, password_hash)
          AND active = TRUE`,
      [input.username, input.password]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Usuario ou senha invalidos.' });
    }

    const user = result.rows[0];

    await db.query(
      `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
       VALUES ($1, 'LOGIN', 'app_users', $2, $3)`,
      [user.username, user.id, JSON.stringify({ role: user.role })]
    );

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };

