const { z } = require('zod');
const db = require('../config/database');

const capabilitySchema = z.object({
  unitId: z.string().uuid(),
  need: z.enum(['EMERGENCIA', 'CONSULTA', 'AGENDAMENTO', 'RETORNO', 'EXAME', 'OUTRO']),
  category: z.string().max(80).optional().nullable(),
  subcategory: z.string().max(100).optional().nullable(),
  minPriority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']).default('BAIXA'),
  notes: z.string().optional().nullable()
});

async function list(req, res, next) {
  try {
    const result = await db.query(
      `SELECT
          c.id,
          c.unit_id,
          u.name AS unit_name,
          c.need,
          c.category,
          c.subcategory,
          c.min_priority,
          c.notes
         FROM unit_capabilities c
         JOIN units u ON u.id = c.unit_id
        ORDER BY u.name, c.need, c.category, c.subcategory`
    );

    res.json({ capabilities: result.rows });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const input = capabilitySchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO unit_capabilities (unit_id, need, category, subcategory, min_priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, unit_id, need, category, subcategory, min_priority, notes`,
      [
        input.unitId,
        input.need,
        cleanNullable(input.category),
        cleanNullable(input.subcategory),
        input.minPriority,
        cleanNullable(input.notes)
      ]
    );

    await log(req, 'CREATE', result.rows[0].id, result.rows[0]);
    res.status(201).json({ capability: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const input = capabilitySchema.parse(req.body);
    const result = await db.query(
      `UPDATE unit_capabilities
          SET unit_id = $1,
              need = $2,
              category = $3,
              subcategory = $4,
              min_priority = $5,
              notes = $6
        WHERE id = $7
        RETURNING id, unit_id, need, category, subcategory, min_priority, notes`,
      [
        input.unitId,
        input.need,
        cleanNullable(input.category),
        cleanNullable(input.subcategory),
        input.minPriority,
        cleanNullable(input.notes),
        req.params.id
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Capacidade nao encontrada.' });

    await log(req, 'UPDATE', result.rows[0].id, result.rows[0]);
    res.json({ capability: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM unit_capabilities
        WHERE id = $1
        RETURNING id`,
      [req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Capacidade nao encontrada.' });

    await log(req, 'DELETE', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function cleanNullable(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

async function log(req, action, entityId, metadata) {
  await db.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
     VALUES ($1, $2, 'unit_capabilities', $3, $4)`,
    [req.user?.username || 'Admin', action, entityId, JSON.stringify(metadata)]
  );
}

module.exports = { list, create, update, remove };

