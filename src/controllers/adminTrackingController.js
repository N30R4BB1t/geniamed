const db = require('../config/database');
const trackingController = require('./trackingController');

async function listActive(req, res, next) {
  try {
    const result = await db.query(
      `SELECT
          o.id,
          o.status,
          o.patient_latitude,
          o.patient_longitude,
          o.last_location_at,
          o.distance_to_unit_km,
          o.eta_minutes,
          p.full_name AS patient_name,
          u.id AS unit_id,
          u.name AS unit_name,
          u.latitude AS unit_latitude,
          u.longitude AS unit_longitude
         FROM occurrences o
         JOIN patients p ON p.id = o.patient_id
         JOIN units u ON u.id = o.unit_id
        WHERE o.status NOT IN ('FINALIZADA', 'CANCELADA')
        ORDER BY o.created_at DESC`
    );
    res.json({ occurrences: result.rows });
  } catch (error) {
    next(error);
  }
}

async function simulateLocation(req, res, next) {
  try {
    const tokenResult = await db.query(
      `SELECT tracking_token
         FROM occurrences
        WHERE id = $1
          AND status NOT IN ('FINALIZADA', 'CANCELADA')`,
      [req.params.id]
    );

    if (tokenResult.rowCount === 0) {
      return res.status(404).json({ error: 'Ocorrencia ativa nao encontrada.' });
    }

    req.body.trackingToken = tokenResult.rows[0].tracking_token;
    req.body.accuracyMeters = req.body.accuracyMeters ?? 5;
    return trackingController.updateLocation(req, res, next);
  } catch (error) {
    next(error);
  }
}

async function resetSimulation(req, res, next) {
  try {
    await db.query(
      `UPDATE occurrences
          SET proximity_alert_sent_at = NULL,
              arrival_alert_sent_at = NULL,
              last_eta_alert_minutes = NULL
        WHERE id = $1`,
      [req.params.id]
    );
    await db.query(
      `UPDATE occurrence_unit_suggestions
          SET status = 'EXPIRADA', responded_at = now()
        WHERE occurrence_id = $1 AND status = 'PENDENTE'`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { listActive, simulateLocation, resetSimulation };
