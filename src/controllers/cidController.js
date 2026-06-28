const { z } = require('zod');
const db = require('../config/database');

const importSchema = z.object({
  kind: z.enum(['CAPITULO', 'GRUPO', 'CATEGORIA', 'SUBCATEGORIA']).default('SUBCATEGORIA'),
  csv: z.string().min(10).max(5_000_000)
});

const suggestionSchema = z.object({
  symptomIds: z.array(z.string().uuid()).max(40).default([])
});

async function stats(req, res, next) {
  try {
    const result = await db.query(
      `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE kind = 'CAPITULO')::int AS chapters,
          COUNT(*) FILTER (WHERE kind = 'GRUPO')::int AS cid_groups,
          COUNT(*) FILTER (WHERE kind = 'CATEGORIA')::int AS categories,
          COUNT(*) FILTER (WHERE kind = 'SUBCATEGORIA')::int AS subcategories
         FROM cid10_codes`
    );
    const groups = await db.query('SELECT COUNT(*)::int AS total FROM symptom_groups WHERE active = TRUE');
    res.json({ ...result.rows[0], groups: groups.rows[0].total });
  } catch (error) {
    next(error);
  }
}

async function importCsv(req, res, next) {
  try {
    const input = importSchema.parse(req.body);
    const rows = parseCsv(input.csv);
    const parsed = rows.map((row) => normalizeCidRow(row, input.kind)).filter(Boolean);

    if (parsed.length === 0) {
      return res.status(400).json({ error: 'Nenhum CID valido foi encontrado no CSV.' });
    }

    let imported = 0;
    await db.transaction(async (client) => {
      for (const item of parsed) {
        await client.query(
          `INSERT INTO cid10_codes
            (code, description, short_description, kind, parent_code, range_start, range_end, chapter_number, source, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DATASUS', now())
           ON CONFLICT (code) DO UPDATE SET
             description = EXCLUDED.description,
             short_description = EXCLUDED.short_description,
             kind = EXCLUDED.kind,
             parent_code = EXCLUDED.parent_code,
             range_start = EXCLUDED.range_start,
             range_end = EXCLUDED.range_end,
             chapter_number = EXCLUDED.chapter_number,
             active = TRUE,
             updated_at = now()`,
          [
            item.code,
            item.description,
            item.shortDescription,
            item.kind,
            item.parentCode,
            item.rangeStart,
            item.rangeEnd,
            item.chapterNumber
          ]
        );
        imported += 1;
      }
    });

    res.json({ imported });
  } catch (error) {
    next(error);
  }
}

async function search(req, res, next) {
  try {
    const term = String(req.query.q || '').trim();
    if (term.length < 2) return res.json({ results: [] });

    const result = await db.query(
      `SELECT id, code, description, short_description, kind
         FROM cid10_codes
        WHERE active = TRUE
          AND (
            code ILIKE $1
            OR description ILIKE $2
            OR short_description ILIKE $2
          )
        ORDER BY
          CASE WHEN code ILIKE $1 THEN 0 ELSE 1 END,
          code
        LIMIT 40`,
      [`${term}%`, `%${term}%`]
    );

    res.json({ results: result.rows });
  } catch (error) {
    next(error);
  }
}

async function listSymptoms(req, res, next) {
  try {
    const result = await db.query(
      `SELECT g.id AS group_id, g.code AS group_code, g.name AS group_name, g.description AS group_description,
              s.id, s.code, s.name, s.keywords
         FROM symptom_groups g
         JOIN symptoms s ON s.group_id = g.id
        WHERE g.active = TRUE AND s.active = TRUE
        ORDER BY g.sort_order, s.sort_order, s.name`
    );

    const groups = [];
    for (const row of result.rows) {
      let group = groups.find((item) => item.id === row.group_id);
      if (!group) {
        group = {
          id: row.group_id,
          code: row.group_code,
          name: row.group_name,
          description: row.group_description,
          symptoms: []
        };
        groups.push(group);
      }
      group.symptoms.push({
        id: row.id,
        code: row.code,
        name: row.name,
        keywords: row.keywords || []
      });
    }

    res.json({ groups });
  } catch (error) {
    next(error);
  }
}

async function suggestBySymptoms(req, res, next) {
  try {
    const input = suggestionSchema.parse(req.body);
    if (input.symptomIds.length === 0) return res.json({ suggestions: [] });

    const symptomResult = await db.query(
      `SELECT id, name, keywords
         FROM symptoms
        WHERE id = ANY($1::uuid[]) AND active = TRUE`,
      [input.symptomIds]
    );

    const result = await db.query(
      `WITH selected_symptoms AS (
          SELECT id, name, keywords
            FROM symptoms
           WHERE id = ANY($1::uuid[])
        ),
        explicit_scores AS (
          SELECT c.id, c.code, c.description, c.short_description, c.kind,
                 l.score::int AS score,
                 s.name AS related_symptom,
                 c.description AS matched_term,
                 'relacao sintoma-cid' AS origin
            FROM symptom_cid10_links l
            JOIN cid10_codes c ON c.id = l.cid10_id
            JOIN selected_symptoms s ON s.id = l.symptom_id
           WHERE l.symptom_id = ANY($1::uuid[]) AND c.active = TRUE
             AND c.kind IN ('CATEGORIA', 'SUBCATEGORIA')
        ),
        keyword_scores AS (
          SELECT c.id, c.code, c.description, c.short_description, c.kind,
                 2::int AS score,
                 s.name AS related_symptom,
                 keyword AS matched_term,
                 'busca por termos' AS origin
            FROM cid10_codes c
            JOIN selected_symptoms s ON TRUE
            JOIN LATERAL unnest(s.keywords) keyword ON (
              c.description ILIKE '%' || keyword || '%'
              OR c.short_description ILIKE '%' || keyword || '%'
            )
           WHERE c.active = TRUE
             AND c.kind IN ('CATEGORIA', 'SUBCATEGORIA')
        ),
        combination_scores AS (
          SELECT c.id, c.code, c.description, c.short_description, c.kind,
                 r.score_bonus::int AS score,
                 r.name AS related_symptom,
                 r.name AS matched_term,
                 'regra de combinacao' AS origin
            FROM symptom_combination_rules r
            JOIN cid10_codes c ON c.id = r.cid10_id
           WHERE r.active = TRUE
             AND c.active = TRUE
             AND c.kind IN ('CATEGORIA', 'SUBCATEGORIA')
             AND r.symptom_ids <@ $1::uuid[]
        )
        SELECT * FROM explicit_scores
        UNION ALL
        SELECT * FROM keyword_scores
        UNION ALL
        SELECT * FROM combination_scores
        LIMIT 500`,
      [input.symptomIds]
    );

    const suggestions = mergeSuggestionRows(result.rows).slice(0, 30);

    res.json({
      symptoms: symptomResult.rows,
      suggestions
    });
  } catch (error) {
    next(error);
  }
}

function mergeSuggestionRows(rows) {
  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, {
        id: row.id,
        code: row.code,
        description: row.description,
        short_description: row.short_description,
        kind: row.kind,
        score: 0,
        matched_symptoms: 0,
        relatedSymptoms: new Set(),
        matchedTerms: new Set(),
        origins: new Set()
      });
    }

    const item = grouped.get(row.id);
    item.score += Number(row.score || 0);
    if (row.related_symptom) item.relatedSymptoms.add(row.related_symptom);
    if (row.matched_term) item.matchedTerms.add(row.matched_term);
    if (row.origin) item.origins.add(row.origin);
    item.matched_symptoms = item.relatedSymptoms.size;
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      relatedSymptoms: Array.from(item.relatedSymptoms),
      matchedTerms: Array.from(item.matchedTerms).slice(0, 6),
      origins: Array.from(item.origins)
    }))
    .sort((a, b) => b.score - a.score || b.matched_symptoms - a.matched_symptoms || a.code.localeCompare(b.code));
}

function normalizeCidRow(row, kind) {
  const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), String(value || '').trim()]));
  const rangeStart = values.catinic || values.inicio || values.inicial || '';
  const rangeEnd = values.catfim || values.fim || values.final || '';
  const chapterNumber = Number(values.numcap || values.capitulo || '');
  const rawCode = values.codigo
    || values.cod
    || values.cat
    || values.subcat
    || values.codigo_cid
    || values.cid
    || (kind === 'CAPITULO' ? `CAP${String(values.numcap || values[0] || '').padStart(2, '0')}` : '')
    || (kind === 'GRUPO' ? `${rangeStart}-${rangeEnd}` : '')
    || values[0]
    || '';
  const description = values.descricao || values.descricao_longa || values.nome || values[1] || '';
  const shortDescription = values.descricao_curta || values.abreviada || values[2] || description;
  const code = rawCode.replaceAll('"', '').trim().toUpperCase();
  if (!code || !description || code.length > 20) return null;

  return {
    code,
    description,
    shortDescription,
    kind,
    parentCode: kind === 'SUBCATEGORIA' ? code.slice(0, 3) : null,
    rangeStart: rangeStart || null,
    rangeEnd: rangeEnd || null,
    chapterNumber: Number.isNaN(chapterNumber) ? null : chapterNumber
  };
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(lines[0]);
  const header = splitCsvLine(lines[0], delimiter).map((value, index) => value.trim() || String(index));
  return lines.slice(1).map((line) => {
    const columns = splitCsvLine(line, delimiter);
    const row = {};
    header.forEach((key, index) => {
      row[key] = columns[index] || '';
      row[index] = columns[index] || '';
    });
    return row;
  });
}

function detectDelimiter(line) {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function splitCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeKey(key) {
  return String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

module.exports = {
  stats,
  importCsv,
  search,
  listSymptoms,
  suggestBySymptoms
};
