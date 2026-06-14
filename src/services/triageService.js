const db = require('../config/database');

const fallbackTypes = [
  {
    need: 'EMERGENCIA',
    label: 'Emergencia',
    categories: [
      {
        code: 'DOR',
        label: 'Dor',
        subcategories: [
          { code: 'DOR_NO_PEITO', label: 'Dor no peito / suspeita cardiovascular', priority: 'CRITICA' },
          { code: 'DOR_ABDOMINAL', label: 'Dor abdominal', priority: 'ALTA' }
        ]
      }
    ]
  },
  { need: 'CONSULTA', label: 'Consulta', categories: [] },
  { need: 'AGENDAMENTO', label: 'Agendamento', categories: [] },
  { need: 'RETORNO', label: 'Retorno', categories: [] },
  { need: 'EXAME', label: 'Exame', categories: [] },
  { need: 'OUTRO', label: 'Outro', categories: [] }
];

async function getOccurrenceTypes() {
  try {
    const result = await db.query(
      `SELECT need, need_label, category_code, category_label, subcategory_code,
              subcategory_label, priority, instructions
         FROM triage_protocols
        WHERE active = TRUE
        ORDER BY sort_order, need_label, category_label, subcategory_label`
    );

    return buildTypes(result.rows);
  } catch (error) {
    if (error.code === '42P01') return fallbackTypes;
    throw error;
  }
}

async function inferPriority(need, category, subcategory) {
  try {
    const result = await db.query(
      `SELECT priority
         FROM triage_protocols
        WHERE active = TRUE
          AND need = $1
          AND COALESCE(category_code, '') = COALESCE($2, '')
          AND COALESCE(subcategory_code, '') = COALESCE($3, '')
        ORDER BY sort_order
        LIMIT 1`,
      [need, category || null, subcategory || null]
    );

    if (result.rowCount > 0) return result.rows[0].priority;
  } catch (error) {
    if (error.code !== '42P01') throw error;
  }

  if (need !== 'EMERGENCIA') return 'BAIXA';
  if (subcategory === 'DOR_NO_PEITO' || subcategory === 'AMPUTACAO' || subcategory === 'FALTA_AR') return 'CRITICA';
  if (category === 'DOR' || category === 'TRAUMA') return 'MEDIA';
  return 'BAIXA';
}

function buildTypes(rows) {
  const needs = new Map();

  for (const row of rows) {
    if (!needs.has(row.need)) {
      needs.set(row.need, {
        need: row.need,
        label: row.need_label,
        categories: []
      });
    }

    const need = needs.get(row.need);
    if (!row.category_code) continue;

    let category = need.categories.find((item) => item.code === row.category_code);
    if (!category) {
      category = {
        code: row.category_code,
        label: row.category_label,
        subcategories: []
      };
      need.categories.push(category);
    }

    if (row.subcategory_code) {
      category.subcategories.push({
        code: row.subcategory_code,
        label: row.subcategory_label,
        priority: row.priority,
        instructions: row.instructions
      });
    }
  }

  return Array.from(needs.values());
}

module.exports = { getOccurrenceTypes, inferPriority };

