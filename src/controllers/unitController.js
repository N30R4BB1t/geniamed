const { z } = require('zod');
const db = require('../config/database');
const { distanceKm } = require('../services/distanceService');

const nearbySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  need: z.string(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable()
});

async function listUnits(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, name, address, city, state, phone, latitude, longitude, active
         FROM units
        ORDER BY name`
    );

    res.json({ units: result.rows });
  } catch (error) {
    next(error);
  }
}

async function findNearby(req, res, next) {
  try {
    const input = nearbySchema.parse(req.body);
    const result = await db.query(
      `SELECT DISTINCT u.id, u.name, u.address, u.city, u.state, u.phone, u.latitude, u.longitude
         FROM units u
         JOIN unit_capabilities c ON c.unit_id = u.id
        WHERE u.active = TRUE
          AND c.need = $1
          AND (c.category IS NULL OR c.category = $2)
          AND (c.subcategory IS NULL OR c.subcategory = $3)`,
      [input.need, input.category || null, input.subcategory || null]
    );

    const units = result.rows
      .map((unit) => ({
        ...unit,
        distanceKm: Number(distanceKm(
          input.latitude,
          input.longitude,
          Number(unit.latitude),
          Number(unit.longitude)
        ).toFixed(2))
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ units });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUnits, findNearby };

