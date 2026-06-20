const { z } = require('zod');
const db = require('../config/database');
const alertHub = require('../services/alertHub');
const { distanceKm } = require('../services/distanceService');

const locationSchema = z.object({
  trackingToken: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().optional().nullable(),
  speedMps: z.number().optional().nullable()
});

const suggestionSchema = z.object({
  trackingToken: z.string().uuid(),
  accept: z.boolean()
});

async function updateLocation(req, res, next) {
  try {
    const input = locationSchema.parse(req.body);
    const occurrenceResult = await db.query(
      `SELECT o.*, u.latitude AS unit_latitude, u.longitude AS unit_longitude, u.name AS unit_name,
              p.full_name AS patient_name
         FROM occurrences o
         JOIN units u ON u.id = o.unit_id
         JOIN patients p ON p.id = o.patient_id
        WHERE o.id = $1
          AND o.tracking_token = $2
          AND o.status NOT IN ('FINALIZADA', 'CANCELADA')`,
      [req.params.id, input.trackingToken]
    );

    if (occurrenceResult.rowCount === 0) {
      return res.status(404).json({ error: 'Rastreamento nao encontrado ou encerrado.' });
    }

    const occurrence = occurrenceResult.rows[0];
    const distance = distanceKm(
      input.latitude,
      input.longitude,
      Number(occurrence.unit_latitude),
      Number(occurrence.unit_longitude)
    );
    const etaMinutes = estimateEta(distance, input.speedMps);
    const shouldAlertProximity = etaMinutes <= 2 && !occurrence.proximity_alert_sent_at;
    const shouldAlertArrival = distance <= 0.15 && !occurrence.arrival_alert_sent_at;
    const shouldAlertEta = shouldEmitEtaAlert(occurrence.last_eta_alert_minutes, etaMinutes);

    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO occurrence_location_history
          (occurrence_id, latitude, longitude, accuracy_meters, speed_mps, distance_to_unit_km, eta_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          occurrence.id,
          input.latitude,
          input.longitude,
          input.accuracyMeters || null,
          input.speedMps || null,
          distance.toFixed(2),
          etaMinutes
        ]
      );

      await client.query(
        `UPDATE occurrences
            SET patient_latitude = $1,
                patient_longitude = $2,
                last_location_at = now(),
                last_speed_mps = $3,
                distance_to_unit_km = $4,
                eta_minutes = $5,
                proximity_alert_sent_at = CASE
                  WHEN $5 <= 2 AND proximity_alert_sent_at IS NULL THEN now()
                  ELSE proximity_alert_sent_at
                END,
                arrival_alert_sent_at = CASE
                  WHEN $4 <= 0.15 AND arrival_alert_sent_at IS NULL THEN now()
                  ELSE arrival_alert_sent_at
                END,
                last_eta_alert_minutes = CASE
                  WHEN $7 = TRUE THEN $5
                  ELSE last_eta_alert_minutes
                END,
                updated_at = now()
          WHERE id = $6`,
        [
          input.latitude,
          input.longitude,
          input.speedMps || null,
          distance.toFixed(2),
          etaMinutes,
          occurrence.id,
          shouldAlertEta
        ]
      );
    });

    const suggestion = await findOrCreateSuggestion(
      occurrence,
      input.latitude,
      input.longitude,
      distance,
      occurrence.distance_to_unit_km === null ? null : Number(occurrence.distance_to_unit_km)
    );
    const payload = {
      occurrenceId: occurrence.id,
      patientName: occurrence.patient_name,
      latitude: input.latitude,
      longitude: input.longitude,
      distanceKm: Number(distance.toFixed(2)),
      etaMinutes,
      unitName: occurrence.unit_name,
      proximityAlert: etaMinutes <= 2,
      arrived: distance <= 0.15,
      problem: formatProblem(occurrence),
      suggestion
    };

    alertHub.publish('patient-location-updated', payload);
    if (shouldAlertEta) alertHub.publish('patient-eta-alert', payload);
    if (shouldAlertProximity) alertHub.publish('patient-proximity-alert', payload);
    if (shouldAlertArrival) alertHub.publish('patient-arrival-alert', payload);
    if (suggestion) alertHub.publish('unit-change-suggested', payload);

    res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function respondSuggestion(req, res, next) {
  try {
    const input = suggestionSchema.parse(req.body);
    const result = await db.transaction(async (client) => {
      const suggestionResult = await client.query(
        `SELECT s.*, o.tracking_token, o.patient_id
           FROM occurrence_unit_suggestions s
           JOIN occurrences o ON o.id = s.occurrence_id
          WHERE s.id = $1
            AND s.occurrence_id = $2
            AND s.status = 'PENDENTE'
          FOR UPDATE`,
        [req.params.suggestionId, req.params.id]
      );

      if (suggestionResult.rowCount === 0 || suggestionResult.rows[0].tracking_token !== input.trackingToken) {
        const error = new Error('Sugestao nao encontrada ou expirada.');
        error.status = 404;
        throw error;
      }

      const suggestion = suggestionResult.rows[0];
      const status = input.accept ? 'ACEITA' : 'RECUSADA';
      await client.query(
        `UPDATE occurrence_unit_suggestions
            SET status = $1, responded_at = now()
          WHERE id = $2`,
        [status, suggestion.id]
      );

      if (input.accept) {
        const nextPosition = await client.query(
          `SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
             FROM service_queue
            WHERE unit_id = $1
              AND status NOT IN ('FINALIZADA', 'CANCELADA')`,
          [suggestion.suggested_unit_id]
        );
        await client.query(
          `UPDATE occurrences SET unit_id = $1, updated_at = now() WHERE id = $2`,
          [suggestion.suggested_unit_id, suggestion.occurrence_id]
        );
        await client.query(
          `UPDATE service_queue
              SET unit_id = $1, queue_position = $2, updated_at = now()
            WHERE occurrence_id = $3`,
          [suggestion.suggested_unit_id, nextPosition.rows[0].next_position, suggestion.occurrence_id]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
         VALUES ('Paciente', $1, 'occurrences', $2, $3)`,
        [
          input.accept ? 'UNIT_REDIRECT_ACCEPTED' : 'UNIT_REDIRECT_REJECTED',
          suggestion.occurrence_id,
          JSON.stringify({
            fromUnitId: suggestion.current_unit_id,
            toUnitId: suggestion.suggested_unit_id,
            suggestionId: suggestion.id
          })
        ]
      );

      return { accepted: input.accept, suggestionId: suggestion.id };
    });

    alertHub.publish('unit-change-responded', { occurrenceId: req.params.id, ...result });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function findOrCreateSuggestion(occurrence, latitude, longitude, currentDistance, previousDistance) {
  if (!['ABERTA', 'ALERTA_ENVIADO', 'EM_PREPARO', 'AGUARDANDO'].includes(occurrence.status)) {
    return null;
  }

  const pending = await db.query(
    `SELECT s.id, s.suggested_unit_id, u.name AS suggested_unit_name,
            s.current_distance_km, s.suggested_distance_km, s.reason
       FROM occurrence_unit_suggestions s
       JOIN units u ON u.id = s.suggested_unit_id
      WHERE s.occurrence_id = $1 AND s.status = 'PENDENTE'
      ORDER BY s.created_at DESC LIMIT 1`,
    [occurrence.id]
  );
  if (pending.rowCount > 0) return normalizeSuggestion(pending.rows[0]);

  const recentResponse = await db.query(
    `SELECT 1
       FROM occurrence_unit_suggestions
      WHERE occurrence_id = $1
        AND status IN ('ACEITA', 'RECUSADA')
        AND responded_at > now() - interval '10 minutes'
      LIMIT 1`,
    [occurrence.id]
  );
  if (recentResponse.rowCount > 0) return null;

  const alternatives = await db.query(
    `SELECT DISTINCT u.id, u.name, u.latitude, u.longitude
       FROM units u
       JOIN unit_capabilities c ON c.unit_id = u.id
      WHERE u.active = TRUE
        AND u.id <> $1
        AND c.need = $2
        AND (c.category IS NULL OR c.category = $3)
        AND (c.subcategory IS NULL OR c.subcategory = $4)`,
    [occurrence.unit_id, occurrence.need, occurrence.category || null, occurrence.subcategory || null]
  );

  const best = alternatives.rows
    .map((unit) => ({
      ...unit,
      distance: distanceKm(latitude, longitude, Number(unit.latitude), Number(unit.longitude))
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!best || currentDistance - best.distance < 2) return null;

  const movingAway = previousDistance !== null && currentDistance > previousDistance + 0.1;
  const majorAdvantage = currentDistance - best.distance >= 5;
  if (!movingAway && !majorAdvantage) return null;

  const reason = `${best.name} esta ${(currentDistance - best.distance).toFixed(1)} km mais proxima da posicao atual.`;
  const created = await db.query(
    `INSERT INTO occurrence_unit_suggestions
      (occurrence_id, current_unit_id, suggested_unit_id, current_distance_km, suggested_distance_km, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, suggested_unit_id, current_distance_km, suggested_distance_km, reason`,
    [occurrence.id, occurrence.unit_id, best.id, currentDistance.toFixed(2), best.distance.toFixed(2), reason]
  );

  return normalizeSuggestion({ ...created.rows[0], suggested_unit_name: best.name });
}

function normalizeSuggestion(row) {
  return {
    id: row.id,
    suggestedUnitId: row.suggested_unit_id,
    suggestedUnitName: row.suggested_unit_name,
    currentDistanceKm: Number(row.current_distance_km),
    suggestedDistanceKm: Number(row.suggested_distance_km),
    reason: row.reason
  };
}

function estimateEta(distance, speedMps) {
  const speedKmH = speedMps && speedMps > 1 ? speedMps * 3.6 : 28;
  return Math.max(1, Math.round((distance / speedKmH) * 60));
}

function shouldEmitEtaAlert(previousEta, currentEta) {
  if (previousEta === null || previousEta === undefined) return true;
  if ([15, 10, 5, 2].includes(currentEta) && currentEta !== previousEta) return true;
  return Math.abs(Number(previousEta) - currentEta) >= 5;
}

function formatProblem(occurrence) {
  return [occurrence.category, occurrence.subcategory, occurrence.details]
    .filter(Boolean)
    .join(' - ');
}

module.exports = { updateLocation, respondSuggestion };
