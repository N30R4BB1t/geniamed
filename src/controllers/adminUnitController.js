const { z } = require('zod');
const db = require('../config/database');

const unitSchema = z.object({
  name: z.string().min(2).max(160),
  address: z.string().min(3),
  city: z.string().min(2).max(120),
  state: z.string().length(2),
  phone: z.string().max(30).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  active: z.boolean().optional()
});

async function list(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, name, address, city, state, phone, latitude, longitude, active, created_at
         FROM units
        ORDER BY name`
    );

    res.json({ units: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, name, address, city, state, phone, latitude, longitude, active, created_at
         FROM units
        WHERE id = $1`,
      [req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Unidade nao encontrada.' });
    res.json({ unit: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const input = unitSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO units (name, address, city, state, phone, latitude, longitude, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, address, city, state, phone, latitude, longitude, active, created_at`,
      [
        input.name,
        input.address,
        input.city,
        input.state.toUpperCase(),
        input.phone || null,
        input.latitude,
        input.longitude,
        input.active ?? true
      ]
    );

    await log(req, 'CREATE', result.rows[0].id, result.rows[0]);
    res.status(201).json({ unit: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const input = unitSchema.parse(req.body);
    const result = await db.query(
      `UPDATE units
          SET name = $1,
              address = $2,
              city = $3,
              state = $4,
              phone = $5,
              latitude = $6,
              longitude = $7,
              active = $8
        WHERE id = $9
        RETURNING id, name, address, city, state, phone, latitude, longitude, active, created_at`,
      [
        input.name,
        input.address,
        input.city,
        input.state.toUpperCase(),
        input.phone || null,
        input.latitude,
        input.longitude,
        input.active ?? true,
        req.params.id
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Unidade nao encontrada.' });

    await log(req, 'UPDATE', result.rows[0].id, result.rows[0]);
    res.json({ unit: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM units
        WHERE id = $1
        RETURNING id`,
      [req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Unidade nao encontrada.' });

    await log(req, 'DELETE', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'Esta unidade possui registros vinculados. Desative a unidade em vez de excluir.'
      });
    }
    next(error);
  }
}

async function log(req, action, entityId, metadata) {
  await db.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
     VALUES ($1, $2, 'units', $3, $4)`,
    [req.user?.username || 'Admin', action, entityId, JSON.stringify(metadata)]
  );
}

module.exports = { list, getById, create, update, remove };

