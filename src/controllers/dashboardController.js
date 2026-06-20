const db = require('../config/database');
const alertHub = require('../services/alertHub');

async function listOccurrences(req, res, next) {
  try {
    const result = await db.query(
      `SELECT
          o.id,
          o.patient_id,
          o.need,
          o.category,
          o.subcategory,
          o.details,
          o.priority,
          o.status,
          o.patient_latitude,
          o.patient_longitude,
          o.created_at,
          o.updated_at,
          o.prepared_at,
          o.awaiting_arrival_at,
          o.attended_at,
          o.finalized_at,
          o.last_location_at,
          o.last_speed_mps,
          o.distance_to_unit_km,
          o.eta_minutes,
          p.full_name AS patient_name,
          p.birth_date,
          u.name AS unit_name,
          u.address AS unit_address,
          u.latitude AS unit_latitude,
          u.longitude AS unit_longitude,
          q.queue_position,
          h.allergies,
          h.chronic_conditions,
          h.current_medications,
          h.blood_type,
          cc.id AS consultation_id,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'fromStatus', sh.from_status,
                  'toStatus', sh.to_status,
                  'actor', sh.actor,
                  'notes', sh.notes,
                  'createdAt', sh.created_at
                )
                ORDER BY sh.created_at
              )
              FROM occurrence_status_history sh
              WHERE sh.occurrence_id = o.id
            ),
            '[]'::json
          ) AS status_history
         FROM occurrences o
         JOIN patients p ON p.id = o.patient_id
         LEFT JOIN units u ON u.id = o.unit_id
         LEFT JOIN service_queue q ON q.occurrence_id = o.id
         LEFT JOIN hospital_histories h ON h.patient_id = p.id
         LEFT JOIN clinical_consultations cc ON cc.occurrence_id = o.id
        WHERE o.status NOT IN ('FINALIZADA', 'CANCELADA')
        ORDER BY
          CASE o.priority
            WHEN 'CRITICA' THEN 1
            WHEN 'ALTA' THEN 2
            WHEN 'MEDIA' THEN 3
            ELSE 4
          END,
          o.created_at ASC`
    );

    res.json({ occurrences: result.rows });
  } catch (error) {
    next(error);
  }
}

function events(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const remove = alertHub.addClient(res);
  req.on('close', remove);
}

module.exports = { listOccurrences, events };
