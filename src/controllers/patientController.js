const db = require('../config/database');

async function getPatient(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, full_name, cpf, birth_date, sex, phone, email
         FROM patients
        WHERE id = $1`,
      [req.params.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Paciente nao encontrado.' });
    res.json({ patient: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function getHistory(req, res, next) {
  try {
    const result = await db.query(
      `SELECT patient_id, allergies, chronic_conditions, current_medications, blood_type, notes, updated_at
         FROM hospital_histories
        WHERE patient_id = $1`,
      [req.params.id]
    );

    res.json({ history: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPatient, getHistory };

