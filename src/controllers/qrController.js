const { z } = require('zod');
const db = require('../config/database');
const { sha256 } = require('../services/hashService');
const tokenService = require('../services/tokenService');

const schema = z.object({
  qrToken: z.string().min(3)
});

async function identifyByQrCode(req, res, next) {
  try {
    const { qrToken } = schema.parse(req.body);
    const tokenHash = sha256(qrToken);

    const result = await db.query(
      `SELECT p.id, p.full_name, p.cpf, p.birth_date, p.sex, p.phone, p.email
         FROM patient_qr_tokens q
         JOIN patients p ON p.id = q.patient_id
        WHERE q.token_hash = $1
          AND q.active = TRUE
          AND (q.expires_at IS NULL OR q.expires_at > now())`,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'QR Code nao identificado ou expirado.' });
    }

    const patient = result.rows[0];
    const patientAccessToken = tokenService.sign({
      purpose: 'PATIENT_ACCESS',
      patientId: patient.id,
      exp: Date.now() + 30 * 60 * 1000
    });

    res.json({ patient, patientAccessToken });
  } catch (error) {
    next(error);
  }
}

module.exports = { identifyByQrCode };
