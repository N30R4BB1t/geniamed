const { z } = require('zod');
const db = require('../config/database');
const sessionService = require('../services/sessionService');

const strongPassword = z.string()
  .min(12)
  .max(120)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

const baseSchema = z.object({
  username: z.string().min(3).max(80),
  fullName: z.string().min(3).max(160),
  role: z.enum(['ADMIN', 'RECEPCAO', 'ENFERMAGEM', 'MEDICO']),
  active: z.boolean().optional()
});

const createSchema = baseSchema.extend({
  password: strongPassword
});

const updateSchema = baseSchema.extend({
  password: strongPassword.optional().nullable()
});

async function list(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, username, full_name, role, active, created_at, updated_at
         FROM app_users
        ORDER BY username`
    );

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const input = createSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO app_users (username, password_hash, full_name, role, active)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
       RETURNING id, username, full_name, role, active, created_at, updated_at`,
      [
        input.username.trim(),
        input.password,
        input.fullName.trim(),
        input.role,
        input.active ?? true
      ]
    );

    await log(req, 'CREATE', result.rows[0].id, result.rows[0]);
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ja existe um usuario com este login.' });
    }
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const input = updateSchema.parse(req.body);
    if (req.user.id === req.params.id && (!input.active || input.role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Voce nao pode remover o proprio acesso administrativo.' });
    }
    const params = [
      input.username.trim(),
      input.fullName.trim(),
      input.role,
      input.active ?? true,
      req.params.id
    ];

    let sql = `UPDATE app_users
                  SET username = $1,
                      full_name = $2,
                      role = $3,
                      active = $4,
                      updated_at = now()`;

    if (input.password) {
      params.push(input.password);
      sql += `, password_hash = crypt($6, gen_salt('bf'))`;
    }

    sql += ` WHERE id = $5
             RETURNING id, username, full_name, role, active, created_at, updated_at`;

    const result = await db.query(sql, params);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario nao encontrado.' });

    if (input.password || !input.active) {
      await sessionService.revokeUserSessions(result.rows[0].id, req.user.id === result.rows[0].id ? req.user.session_id : null);
    }

    await log(req, 'UPDATE', result.rows[0].id, result.rows[0]);
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ja existe um usuario com este login.' });
    }
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    if (req.user?.id === req.params.id) {
      return res.status(400).json({ error: 'Voce nao pode excluir seu proprio usuario.' });
    }

    const result = await db.query(
      `DELETE FROM app_users
        WHERE id = $1
        RETURNING id`,
      [req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario nao encontrado.' });

    await log(req, 'DELETE', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function log(req, action, entityId, metadata) {
  await db.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
     VALUES ($1, $2, 'app_users', $3, $4)`,
    [req.user?.username || 'Admin', action, entityId, JSON.stringify(metadata)]
  );
}

module.exports = { list, create, update, remove };
