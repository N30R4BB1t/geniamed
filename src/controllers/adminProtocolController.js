const { z } = require('zod');
const db = require('../config/database');

const protocolSchema = z.object({
  need: z.enum(['EMERGENCIA', 'CONSULTA', 'AGENDAMENTO', 'RETORNO', 'EXAME', 'OUTRO']),
  needLabel: z.string().min(2).max(80),
  categoryCode: z.string().max(80).optional().nullable(),
  categoryLabel: z.string().max(120).optional().nullable(),
  subcategoryCode: z.string().max(100).optional().nullable(),
  subcategoryLabel: z.string().max(160).optional().nullable(),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
  instructions: z.string().optional().nullable(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional()
});

async function list(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, need, need_label, category_code, category_label,
              subcategory_code, subcategory_label, priority, instructions,
              active, sort_order, created_at, updated_at
         FROM triage_protocols
        ORDER BY sort_order, need_label, category_label, subcategory_label`
    );

    res.json({ protocols: result.rows });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const input = protocolSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO triage_protocols
        (need, need_label, category_code, category_label, subcategory_code,
         subcategory_label, priority, instructions, active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      values(input)
    );

    await log(req, 'CREATE', result.rows[0].id, result.rows[0]);
    res.status(201).json({ protocol: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe um protocolo com estes codigos.' });
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const input = protocolSchema.parse(req.body);
    const result = await db.query(
      `UPDATE triage_protocols
          SET need = $1,
              need_label = $2,
              category_code = $3,
              category_label = $4,
              subcategory_code = $5,
              subcategory_label = $6,
              priority = $7,
              instructions = $8,
              active = $9,
              sort_order = $10,
              updated_at = now()
        WHERE id = $11
        RETURNING *`,
      [...values(input), req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Protocolo nao encontrado.' });

    await log(req, 'UPDATE', result.rows[0].id, result.rows[0]);
    res.json({ protocol: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe um protocolo com estes codigos.' });
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM triage_protocols
        WHERE id = $1
        RETURNING id`,
      [req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Protocolo nao encontrado.' });

    await log(req, 'DELETE', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function values(input) {
  return [
    input.need,
    input.needLabel.trim(),
    clean(input.categoryCode),
    clean(input.categoryLabel),
    clean(input.subcategoryCode),
    clean(input.subcategoryLabel),
    input.priority,
    clean(input.instructions),
    input.active ?? true,
    input.sortOrder ?? 0
  ];
}

function clean(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

async function log(req, action, entityId, metadata) {
  await db.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
     VALUES ($1, $2, 'triage_protocols', $3, $4)`,
    [req.user?.username || 'Admin', action, entityId, JSON.stringify(metadata)]
  );
}

module.exports = { list, create, update, remove };

