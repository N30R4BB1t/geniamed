const db = require('../config/database');
const { z } = require('zod');

const createSchema = z.object({
  fullName: z.string().min(3).max(160),
  cpf: z.string().max(14).optional().nullable(),
  birthDate: z.string().min(10),
  sex: z.enum(['F', 'M', 'O', 'NI']).default('NI'),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  allergies: z.string().optional().nullable(),
  chronicConditions: z.string().optional().nullable(),
  currentMedications: z.string().optional().nullable(),
  bloodType: z.string().max(5).optional().nullable(),
  notes: z.string().optional().nullable()
});

async function listPatients(req, res, next) {
  try {
    const result = await db.query(
      `SELECT
          p.id,
          p.full_name,
          p.cpf,
          p.birth_date,
          p.sex,
          p.phone,
          p.email,
          p.created_at,
          h.allergies,
          h.chronic_conditions,
          h.current_medications,
          h.blood_type
         FROM patients p
         LEFT JOIN hospital_histories h ON h.patient_id = p.id
        ORDER BY p.created_at DESC
        LIMIT 50`
    );

    res.json({ patients: result.rows });
  } catch (error) {
    next(error);
  }
}

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

async function createPatient(req, res, next) {
  try {
    const input = createSchema.parse(req.body);

    const patient = await db.transaction(async (client) => {
      const created = await client.query(
        `INSERT INTO patients (full_name, cpf, birth_date, sex, phone, email)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, cpf, birth_date, sex, phone, email, created_at`,
        [
          input.fullName,
          clean(input.cpf),
          input.birthDate,
          input.sex,
          clean(input.phone),
          clean(input.email)
        ]
      );

      await client.query(
        `INSERT INTO hospital_histories
          (patient_id, allergies, chronic_conditions, current_medications, blood_type, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          created.rows[0].id,
          clean(input.allergies),
          clean(input.chronicConditions),
          clean(input.currentMedications),
          clean(input.bloodType),
          clean(input.notes)
        ]
      );

      return created.rows[0];
    });

    res.status(201).json({ patient });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'CPF ja cadastrado.' });
    next(error);
  }
}

function clean(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

module.exports = { listPatients, getPatient, getHistory, createPatient };
