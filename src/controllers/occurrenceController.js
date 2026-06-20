const { z } = require('zod');
const db = require('../config/database');
const alertHub = require('../services/alertHub');
const { getOccurrenceTypes, inferPriority } = require('../services/triageService');

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
  status: z.enum(['EM_PREPARO', 'AGUARDANDO', 'EM_ATENDIMENTO', 'FINALIZADA', 'CANCELADA']),
  actor: z.string().max(120).optional(),
  notes: z.string().max(500).optional().nullable()
});

const allowedTransitions = {
  ABERTA: ['EM_PREPARO', 'CANCELADA'],
  ALERTA_ENVIADO: ['EM_PREPARO', 'CANCELADA'],
  EM_PREPARO: ['AGUARDANDO', 'CANCELADA'],
  AGUARDANDO: ['EM_ATENDIMENTO', 'CANCELADA'],
  EM_ATENDIMENTO: ['FINALIZADA', 'CANCELADA'],
  FINALIZADA: [],
  CANCELADA: []
};

const timestampColumns = {
  EM_PREPARO: 'prepared_at',
  AGUARDANDO: 'awaiting_arrival_at',
  EM_ATENDIMENTO: 'attended_at',
  FINALIZADA: 'finalized_at'
};

async function getTypes(req, res, next) {
  try {
    const types = await getOccurrenceTypes();
    res.json({ types });
  } catch (error) {
    next(error);
  }
}

async function createOccurrence(req, res, next) {
  try {
    const input = createSchema.parse(req.body);
    const priority = await inferPriority(input.need, input.category, input.subcategory);

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
         VALUES ($1, $2, $3, 'ALERTA_ENVIADO')`,
        [occurrence.rows[0].id, input.unitId, nextPosition.rows[0].next_position]
      );

      await client.query(
        `INSERT INTO occurrence_status_history
          (occurrence_id, from_status, to_status, actor, notes)
         VALUES ($1, NULL, 'ALERTA_ENVIADO', 'App do paciente', 'Ocorrencia criada e alerta enviado para a unidade.')`,
        [occurrence.rows[0].id]
      );

      return occurrence.rows[0];
    });

    const alertResult = await db.query(
      `SELECT o.*, p.full_name AS patient_name, u.name AS unit_name
         FROM occurrences o
         JOIN patients p ON p.id = o.patient_id
         LEFT JOIN units u ON u.id = o.unit_id
        WHERE o.id = $1`,
      [result.id]
    );
    const alertOccurrence = alertResult.rows[0] || result;

    alertHub.publish('occurrence-created', alertOccurrence);
    res.status(201).json({ occurrence: result });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const input = statusSchema.parse(req.body);
    const actor = input.actor || 'Dashboard operacional';

    const result = await db.transaction(async (client) => {
      const currentResult = await client.query(
        `SELECT *
           FROM occurrences
          WHERE id = $1
          FOR UPDATE`,
        [req.params.id]
      );

      if (currentResult.rowCount === 0) {
        const error = new Error('Ocorrencia nao encontrada.');
        error.status = 404;
        throw error;
      }

      const current = currentResult.rows[0];
      const allowed = allowedTransitions[current.status] || [];

      if (!allowed.includes(input.status)) {
        const error = new Error(`Transicao invalida: ${current.status} -> ${input.status}.`);
        error.status = 409;
        throw error;
      }

      const timestampColumn = timestampColumns[input.status];
      const timestampSet = timestampColumn ? `, ${timestampColumn} = now()` : '';
      const updated = await client.query(
        `UPDATE occurrences
            SET status = $1,
                updated_at = now()
                ${timestampSet}
          WHERE id = $2
          RETURNING *`,
        [input.status, req.params.id]
      );

      await client.query(
        `UPDATE service_queue
            SET status = $1, updated_at = now()
          WHERE occurrence_id = $2`,
        [input.status, req.params.id]
      );

      await client.query(
        `INSERT INTO occurrence_status_history
          (occurrence_id, from_status, to_status, actor, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, current.status, input.status, actor, input.notes || null]
      );

      await client.query(
        `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
         VALUES ($1, 'STATUS_CHANGE', 'occurrences', $2, $3)`,
        [
          actor,
          req.params.id,
          JSON.stringify({ from: current.status, to: input.status })
        ]
      );

      let consultationId = null;

      if (input.status === 'EM_ATENDIMENTO') {
        const existing = await client.query(
          `SELECT id
             FROM clinical_consultations
            WHERE occurrence_id = $1`,
          [req.params.id]
        );

        if (existing.rowCount > 0) {
          consultationId = existing.rows[0].id;
        } else {
          const consultation = await client.query(
            `INSERT INTO clinical_consultations
              (patient_id, occurrence_id, status, created_by)
             VALUES ($1, $2, 'EM_ANDAMENTO', $3)
             RETURNING id`,
            [current.patient_id, req.params.id, actor]
          );
          consultationId = consultation.rows[0].id;
        }
      }

      if (input.status === 'FINALIZADA') {
        const consultation = await client.query(
          `UPDATE clinical_consultations
              SET status = 'FINALIZADA', updated_at = now()
            WHERE occurrence_id = $1
            RETURNING id`,
          [req.params.id]
        );
        consultationId = consultation.rows[0]?.id || null;
      }

      return {
        occurrence: updated.rows[0],
        consultationId
      };
    });

    alertHub.publish('occurrence-updated', result.occurrence);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getTypes, createOccurrence, updateStatus };
