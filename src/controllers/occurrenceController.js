const { z } = require('zod');
const db = require('../config/database');
const alertHub = require('../services/alertHub');
const { occurrenceTypes, inferPriority } = require('../services/triageService');

const createSchema = z.object({
  patientId: z.string().uuid(),
  unitId: z.string().uuid(),
  need: z.string(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable()
});

const statusSchema = z.object({
  status: z.enum(['ABERTA', 'ALERTA_ENVIADO', 'EM_PREPARO', 'AGUARDANDO', 'EM_ATENDIMENTO', 'FINALIZADA', 'CANCELADA'])
});

function getTypes(req, res) {
  res.json({ types: occurrenceTypes });
}

async function createOccurrence(req, res, next) {
  try {
    const input = createSchema.parse(req.body);
    const priority = inferPriority(input.need, input.category, input.subcategory);

    const result = await db.transaction(async (client) => {
      const occurrence = await client.query(
        `INSERT INTO occurrences
          (patient_id, unit_id, need, category, subcategory, details, patient_latitude, patient_longitude, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ALERTA_ENVIADO')
         RETURNING *`,
        [
          input.patientId,
          input.unitId,
          input.need,
          input.category || null,
          input.subcategory || null,
          input.details || null,
          input.latitude || null,
          input.longitude || null,
          priority
        ]
      );

      const nextPosition = await client.query(
        `SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
           FROM service_queue
          WHERE unit_id = $1
            AND status NOT IN ('FINALIZADA', 'CANCELADA')`,
        [input.unitId]
      );

      await client.query(
        `INSERT INTO service_queue (occurrence_id, unit_id, queue_position, status)
         VALUES ($1, $2, $3, 'AGUARDANDO')`,
        [occurrence.rows[0].id, input.unitId, nextPosition.rows[0].next_position]
      );

      return occurrence.rows[0];
    });

    alertHub.publish('occurrence-created', result);
    res.status(201).json({ occurrence: result });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = statusSchema.parse(req.body);
    const result = await db.query(
      `UPDATE occurrences
          SET status = $1, updated_at = now()
        WHERE id = $2
        RETURNING *`,
      [status, req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Ocorrencia nao encontrada.' });

    await db.query(
      `UPDATE service_queue SET status = $1, updated_at = now() WHERE occurrence_id = $2`,
      [status, req.params.id]
    );

    alertHub.publish('occurrence-updated', result.rows[0]);
    res.json({ occurrence: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTypes, createOccurrence, updateStatus };

