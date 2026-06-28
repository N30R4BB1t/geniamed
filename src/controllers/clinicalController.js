const { z } = require('zod');
const db = require('../config/database');

const uuid = z.string().uuid();
const nullableText = z.string().max(10000).optional().nullable();

const triageSchema = z.object({
  patientId: uuid,
  complaint: z.string().min(1).max(4000),
  systolic: z.coerce.number().int().optional().nullable(),
  diastolic: z.coerce.number().int().optional().nullable(),
  heartRate: z.coerce.number().int().optional().nullable(),
  respRate: z.coerce.number().int().optional().nullable(),
  temperature: z.coerce.number().optional().nullable(),
  saturation: z.coerce.number().int().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  bmi: z.coerce.number().optional().nullable(),
  painScale: z.coerce.number().int().optional().nullable()
});

const anamnesisSchema = z.object({
  patientId: uuid,
  complaint: z.string().min(1).max(4000),
  currentHistory: z.string().min(1).max(10000),
  personalHistory: nullableText,
  surgicalHistory: nullableText,
  allergies: nullableText,
  medications: nullableText,
  gynecoHistory: nullableText,
  familyHistory: nullableText,
  habits: nullableText,
  systemsReview: nullableText,
  physicalExam: nullableText
});

const consultationSchema = z.object({
  patientId: uuid,
  triageId: uuid.optional().nullable(),
  anamnesisId: uuid.optional().nullable(),
  status: z.enum(['EM_ANDAMENTO', 'FINALIZADA', 'RETORNO_SOLICITADO']).default('EM_ANDAMENTO'),
  cid: nullableText,
  conduct: nullableText,
  returnGuidance: nullableText
});

const prescriptionSchema = z.object({
  patientId: uuid,
  consultationId: uuid.optional().nullable(),
  items: z.array(z.object({
    medication: z.string().min(1).max(200),
    dose: z.string().min(1).max(100),
    pharmaceuticalForm: z.string().min(1).max(100),
    route: z.string().min(1).max(80),
    frequency: z.string().min(1).max(100),
    duration: z.string().min(1).max(100),
    instructions: nullableText
  })).min(1).max(50)
});

const evolutionSchema = z.object({
  patientId: uuid,
  consultationId: uuid.optional().nullable(),
  evolutionType: z.string().max(80).optional().nullable(),
  subjective: nullableText,
  objective: nullableText,
  assessment: nullableText,
  plan: nullableText,
  notes: nullableText
});

const attachmentSchema = z.object({
  patientId: uuid,
  consultationId: uuid.optional().nullable(),
  title: z.string().min(1).max(180),
  documentType: z.string().max(80).optional().nullable(),
  fileName: z.string().max(220).optional().nullable(),
  fileUrl: z.string().max(2000).refine(
    (value) => !value || value.startsWith('/') || value.startsWith('https://'),
    'O arquivo deve usar HTTPS ou caminho interno.'
  ).optional().nullable(),
  description: nullableText
});

async function listTriages(req, res, next) {
  try {
    const result = await db.query(
      `SELECT t.*, p.full_name AS patient_name
         FROM clinical_triages t
         JOIN patients p ON p.id = t.patient_id
        ORDER BY t.created_at DESC`
    );
    res.json({ triages: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createTriage(req, res, next) {
  try {
    const input = triageSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO clinical_triages
        (patient_id, complaint, systolic, diastolic, heart_rate, resp_rate, temperature,
         saturation, weight, height, bmi, pain_scale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        input.patientId,
        input.complaint,
        nullish(input.systolic),
        nullish(input.diastolic),
        nullish(input.heartRate),
        nullish(input.respRate),
        nullish(input.temperature),
        nullish(input.saturation),
        nullish(input.weight),
        nullish(input.height),
        nullish(input.bmi),
        nullish(input.painScale)
      ]
    );
    res.status(201).json({ triage: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function listAnamneses(req, res, next) {
  try {
    const result = await db.query(
      `SELECT a.*, p.full_name AS patient_name
         FROM clinical_anamneses a
         JOIN patients p ON p.id = a.patient_id
        ORDER BY a.created_at DESC`
    );
    res.json({ anamneses: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createAnamnesis(req, res, next) {
  try {
    const input = anamnesisSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO clinical_anamneses
        (patient_id, complaint, current_history, personal_history, surgical_history,
         allergies, medications, gyneco_history, family_history, habits, systems_review, physical_exam)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        input.patientId,
        input.complaint,
        input.currentHistory,
        clean(input.personalHistory),
        clean(input.surgicalHistory),
        clean(input.allergies),
        clean(input.medications),
        clean(input.gynecoHistory),
        clean(input.familyHistory),
        clean(input.habits),
        clean(input.systemsReview),
        clean(input.physicalExam)
      ]
    );
    res.status(201).json({ anamnesis: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function listConsultations(req, res, next) {
  try {
    const result = await db.query(
      `SELECT c.*, p.full_name AS patient_name
         FROM clinical_consultations c
         JOIN patients p ON p.id = c.patient_id
        ORDER BY c.created_at DESC`
    );
    res.json({ consultations: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createConsultation(req, res, next) {
  try {
    const input = consultationSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO clinical_consultations
        (patient_id, triage_id, anamnesis_id, status, cid, conduct, return_guidance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.patientId,
        clean(input.triageId),
        clean(input.anamnesisId),
        input.status,
        clean(input.cid),
        clean(input.conduct),
        clean(input.returnGuidance)
      ]
    );
    res.status(201).json({ consultation: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function listPrescriptions(req, res, next) {
  try {
    const result = await db.query(
      `SELECT pr.*, p.full_name AS patient_name,
              COALESCE(json_agg(i.* ORDER BY i.sort_order) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM clinical_prescriptions pr
         JOIN patients p ON p.id = pr.patient_id
         LEFT JOIN clinical_prescription_items i ON i.prescription_id = pr.id
        GROUP BY pr.id, p.full_name
        ORDER BY pr.created_at DESC`
    );
    res.json({ prescriptions: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createPrescription(req, res, next) {
  try {
    const input = prescriptionSchema.parse(req.body);
    const prescription = await db.transaction(async (client) => {
      const created = await client.query(
        `INSERT INTO clinical_prescriptions (patient_id, consultation_id)
         VALUES ($1, $2)
         RETURNING *`,
        [input.patientId, clean(input.consultationId)]
      );

      for (const [index, item] of input.items.entries()) {
        await client.query(
          `INSERT INTO clinical_prescription_items
            (prescription_id, medication, dose, pharmaceutical_form, route, frequency, duration, instructions, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            created.rows[0].id,
            item.medication,
            item.dose,
            item.pharmaceuticalForm,
            item.route,
            item.frequency,
            item.duration,
            clean(item.instructions),
            index
          ]
        );
      }

      return created.rows[0];
    });
    res.status(201).json({ prescription });
  } catch (error) {
    next(error);
  }
}

async function listEvolutions(req, res, next) {
  try {
    const result = await db.query(
      `SELECT e.*, p.full_name AS patient_name
         FROM clinical_evolutions e
         JOIN patients p ON p.id = e.patient_id
        ORDER BY e.created_at DESC`
    );
    res.json({ evolutions: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createEvolution(req, res, next) {
  try {
    const input = evolutionSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO clinical_evolutions
        (patient_id, consultation_id, evolution_type, subjective, objective, assessment, plan, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.patientId,
        clean(input.consultationId),
        clean(input.evolutionType) || 'EVOLUCAO',
        clean(input.subjective),
        clean(input.objective),
        clean(input.assessment),
        clean(input.plan),
        clean(input.notes)
      ]
    );
    res.status(201).json({ evolution: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function listAttachments(req, res, next) {
  try {
    const result = await db.query(
      `SELECT a.*, p.full_name AS patient_name
         FROM clinical_attachments a
         JOIN patients p ON p.id = a.patient_id
        ORDER BY a.created_at DESC`
    );
    res.json({ attachments: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createAttachment(req, res, next) {
  try {
    const input = attachmentSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO clinical_attachments
        (patient_id, consultation_id, title, document_type, file_name, file_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.patientId,
        clean(input.consultationId),
        input.title,
        clean(input.documentType) || 'OUTRO',
        clean(input.fileName),
        clean(input.fileUrl),
        clean(input.description)
      ]
    );
    res.status(201).json({ attachment: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

function clean(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

function nullish(value) {
  return value === undefined || value === null || Number.isNaN(value) ? null : value;
}

module.exports = {
  listTriages,
  createTriage,
  listAnamneses,
  createAnamnesis,
  listConsultations,
  createConsultation,
  listPrescriptions,
  createPrescription,
  listEvolutions,
  createEvolution,
  listAttachments,
  createAttachment
};
