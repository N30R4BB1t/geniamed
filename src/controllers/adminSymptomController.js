const { z } = require('zod');
const db = require('../config/database');

const uuid = z.string().uuid();

const groupSchema = z.object({
  code: z.string().min(2).max(60),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  active: z.boolean().optional()
});

const symptomSchema = z.object({
  groupId: uuid,
  code: z.string().min(2).max(80),
  name: z.string().min(2).max(160),
  keywords: z.array(z.string().min(1).max(120)).max(80).optional().default([]),
  sortOrder: z.coerce.number().int().optional(),
  active: z.boolean().optional()
});

const linkSchema = z.object({
  symptomId: uuid,
  cid10Id: uuid,
  score: z.coerce.number().int().min(1).max(100).default(10),
  notes: z.string().max(1000).optional().nullable()
});

const candidateReviewSchema = z.object({
  approve: z.boolean(),
  score: z.coerce.number().int().min(1).max(100).optional()
});

const combinationRuleSchema = z.object({
  name: z.string().min(3).max(160),
  symptomIds: z.array(uuid).min(2).max(12),
  cid10Id: uuid,
  scoreBonus: z.coerce.number().int().min(1).max(100).default(10),
  notes: z.string().max(1000).optional().nullable(),
  active: z.boolean().optional()
});

async function listGroups(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, code, name, description, sort_order, active
         FROM symptom_groups
        ORDER BY sort_order, name`
    );
    res.json({ groups: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createGroup(req, res, next) {
  try {
    const input = groupSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO symptom_groups (code, name, description, sort_order, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      groupValues(input)
    );
    await log(req, 'CREATE_GROUP', 'symptom_groups', result.rows[0].id, result.rows[0]);
    res.status(201).json({ group: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe um grupo com este codigo.' });
    next(error);
  }
}

async function updateGroup(req, res, next) {
  try {
    const input = groupSchema.parse(req.body);
    const result = await db.query(
      `UPDATE symptom_groups
          SET code = $1, name = $2, description = $3, sort_order = $4, active = $5
        WHERE id = $6
        RETURNING *`,
      [...groupValues(input), req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Grupo nao encontrado.' });
    await log(req, 'UPDATE_GROUP', 'symptom_groups', result.rows[0].id, result.rows[0]);
    res.json({ group: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe um grupo com este codigo.' });
    next(error);
  }
}

async function removeGroup(req, res, next) {
  try {
    const result = await db.query('DELETE FROM symptom_groups WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Grupo nao encontrado.' });
    await log(req, 'DELETE_GROUP', 'symptom_groups', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    if (error.code === '23503') return res.status(409).json({ error: 'Este grupo possui sintomas vinculados.' });
    next(error);
  }
}

async function listSymptoms(req, res, next) {
  try {
    const result = await db.query(
      `SELECT s.id, s.group_id, g.name AS group_name, s.code, s.name, s.keywords, s.sort_order, s.active
         FROM symptoms s
         JOIN symptom_groups g ON g.id = s.group_id
        ORDER BY g.sort_order, s.sort_order, s.name`
    );
    res.json({ symptoms: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createSymptom(req, res, next) {
  try {
    const input = symptomSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO symptoms (group_id, code, name, keywords, sort_order, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      symptomValues(input)
    );
    await log(req, 'CREATE_SYMPTOM', 'symptoms', result.rows[0].id, result.rows[0]);
    res.status(201).json({ symptom: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe um sintoma com este codigo.' });
    next(error);
  }
}

async function updateSymptom(req, res, next) {
  try {
    const input = symptomSchema.parse(req.body);
    const result = await db.query(
      `UPDATE symptoms
          SET group_id = $1, code = $2, name = $3, keywords = $4, sort_order = $5, active = $6
        WHERE id = $7
        RETURNING *`,
      [...symptomValues(input), req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sintoma nao encontrado.' });
    await log(req, 'UPDATE_SYMPTOM', 'symptoms', result.rows[0].id, result.rows[0]);
    res.json({ symptom: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe um sintoma com este codigo.' });
    next(error);
  }
}

async function removeSymptom(req, res, next) {
  try {
    const result = await db.query('DELETE FROM symptoms WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sintoma nao encontrado.' });
    await log(req, 'DELETE_SYMPTOM', 'symptoms', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    if (error.code === '23503') return res.status(409).json({ error: 'Este sintoma esta vinculado a anamneses ou CIDs.' });
    next(error);
  }
}

async function listLinks(req, res, next) {
  try {
    const result = await db.query(
      `SELECT l.id, l.symptom_id, s.name AS symptom_name, l.cid10_id,
              c.code AS cid_code, c.description AS cid_description, l.score, l.notes, l.created_at
         FROM symptom_cid10_links l
         JOIN symptoms s ON s.id = l.symptom_id
         JOIN cid10_codes c ON c.id = l.cid10_id
        ORDER BY s.name, l.score DESC, c.code`
    );
    res.json({ links: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createLink(req, res, next) {
  try {
    const input = linkSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO symptom_cid10_links (symptom_id, cid10_id, score, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.symptomId, input.cid10Id, input.score, clean(input.notes)]
    );
    await log(req, 'CREATE_SYMPTOM_CID_LINK', 'symptom_cid10_links', result.rows[0].id, result.rows[0]);
    res.status(201).json({ link: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Este sintoma ja esta vinculado a este CID.' });
    next(error);
  }
}

async function updateLink(req, res, next) {
  try {
    const input = linkSchema.parse(req.body);
    const result = await db.query(
      `UPDATE symptom_cid10_links
          SET symptom_id = $1, cid10_id = $2, score = $3, notes = $4
        WHERE id = $5
        RETURNING *`,
      [input.symptomId, input.cid10Id, input.score, clean(input.notes), req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Vinculo nao encontrado.' });
    await log(req, 'UPDATE_SYMPTOM_CID_LINK', 'symptom_cid10_links', result.rows[0].id, result.rows[0]);
    res.json({ link: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Este sintoma ja esta vinculado a este CID.' });
    next(error);
  }
}

async function removeLink(req, res, next) {
  try {
    const result = await db.query('DELETE FROM symptom_cid10_links WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Vinculo nao encontrado.' });
    await log(req, 'DELETE_SYMPTOM_CID_LINK', 'symptom_cid10_links', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function generateCandidates(req, res, next) {
  try {
    const symptomsResult = await db.query(
      `SELECT id, name, keywords
         FROM symptoms
        WHERE active = TRUE AND cardinality(keywords) > 0`
    );

    let generated = 0;
    await db.transaction(async (client) => {
      for (const symptom of symptomsResult.rows) {
        const keywords = normalizeKeywords([symptom.name, ...(symptom.keywords || [])]);
        if (keywords.length === 0) continue;

        const matches = await client.query(
          `SELECT c.id, c.code, c.description, c.short_description,
                  ARRAY(
                    SELECT keyword
                      FROM unnest($1::text[]) keyword
                     WHERE c.description ILIKE '%' || keyword || '%'
                        OR c.short_description ILIKE '%' || keyword || '%'
                  ) AS matched_keywords
             FROM cid10_codes c
            WHERE c.active = TRUE
              AND c.kind IN ('CATEGORIA', 'SUBCATEGORIA')
              AND EXISTS (
                SELECT 1
                  FROM unnest($1::text[]) keyword
                 WHERE c.description ILIKE '%' || keyword || '%'
                    OR c.short_description ILIKE '%' || keyword || '%'
              )
            ORDER BY c.kind, c.code
            LIMIT 80`,
          [keywords]
        );

        for (const cid of matches.rows) {
          const matchedKeywords = cid.matched_keywords || [];
          const score = Math.min(12, 2 + matchedKeywords.length * 2 + (matchedKeywords.some((value) => value.length >= 8) ? 2 : 0));
          await client.query(
            `INSERT INTO symptom_cid10_candidates
              (symptom_id, cid10_id, suggested_score, matched_keywords, origin)
             VALUES ($1, $2, $3, $4, 'AUTO_KEYWORD')
             ON CONFLICT (symptom_id, cid10_id) DO UPDATE SET
               suggested_score = EXCLUDED.suggested_score,
               matched_keywords = EXCLUDED.matched_keywords,
               status = CASE
                 WHEN symptom_cid10_candidates.status = 'PENDENTE' THEN 'PENDENTE'
                 ELSE symptom_cid10_candidates.status
               END`,
            [symptom.id, cid.id, score, matchedKeywords]
          );
          generated += 1;
        }
      }
    });

    res.json({ generated });
  } catch (error) {
    next(error);
  }
}

async function listCandidates(req, res, next) {
  try {
    const status = String(req.query.status || 'PENDENTE').toUpperCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(30, Math.max(10, Number(req.query.pageSize || 10)));
    const search = String(req.query.search || '').trim();
    const sort = String(req.query.sort || 'created_desc');
    const offset = (page - 1) * pageSize;
    const orderBy = candidateOrderBy(sort);

    const params = [status];
    let searchClause = '';
    if (search) {
      params.push(`%${search}%`);
      searchClause = ` AND (
        s.name ILIKE $${params.length}
        OR c.code ILIKE $${params.length}
        OR c.description ILIKE $${params.length}
        OR EXISTS (
          SELECT 1 FROM unnest(cand.matched_keywords) keyword
          WHERE keyword ILIKE $${params.length}
        )
      )`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total
         FROM symptom_cid10_candidates cand
         JOIN symptoms s ON s.id = cand.symptom_id
         JOIN cid10_codes c ON c.id = cand.cid10_id
        WHERE cand.status = $1
        ${searchClause}`,
      params
    );

    params.push(pageSize, offset);
    const result = await db.query(
      `SELECT cand.id, cand.symptom_id, s.name AS symptom_name,
              cand.cid10_id, c.code AS cid_code, c.description AS cid_description,
              cand.suggested_score, cand.matched_keywords, cand.origin, cand.status,
              cand.reviewed_by, cand.reviewed_at, cand.created_at
         FROM symptom_cid10_candidates cand
         JOIN symptoms s ON s.id = cand.symptom_id
         JOIN cid10_codes c ON c.id = cand.cid10_id
        WHERE cand.status = $1
        ${searchClause}
        ORDER BY ${orderBy}
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({
      candidates: result.rows,
      page,
      pageSize,
      total: countResult.rows[0].total,
      totalPages: Math.max(1, Math.ceil(countResult.rows[0].total / pageSize))
    });
  } catch (error) {
    next(error);
  }
}

async function reviewCandidate(req, res, next) {
  try {
    const input = candidateReviewSchema.parse(req.body);
    const result = await db.transaction(async (client) => {
      const current = await client.query(
        `SELECT *
           FROM symptom_cid10_candidates
          WHERE id = $1
          FOR UPDATE`,
        [req.params.id]
      );
      if (current.rowCount === 0) {
        const error = new Error('Candidato nao encontrado.');
        error.status = 404;
        throw error;
      }

      const candidate = current.rows[0];
      const status = input.approve ? 'APROVADO' : 'REJEITADO';
      if (input.approve) {
        await client.query(
          `INSERT INTO symptom_cid10_links (symptom_id, cid10_id, score, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (symptom_id, cid10_id) DO UPDATE SET
             score = EXCLUDED.score,
             notes = EXCLUDED.notes`,
          [
            candidate.symptom_id,
            candidate.cid10_id,
            input.score || candidate.suggested_score,
            `Gerado automaticamente por ${candidate.origin}. Termos: ${(candidate.matched_keywords || []).join(', ')}`
          ]
        );
      }

      const updated = await client.query(
        `UPDATE symptom_cid10_candidates
            SET status = $1, reviewed_by = $2, reviewed_at = now()
          WHERE id = $3
          RETURNING *`,
        [status, req.user?.username || 'Admin', candidate.id]
      );
      return updated.rows[0];
    });

    await log(req, input.approve ? 'APPROVE_SYMPTOM_CID_CANDIDATE' : 'REJECT_SYMPTOM_CID_CANDIDATE', 'symptom_cid10_candidates', result.id, result);
    res.json({ candidate: result });
  } catch (error) {
    next(error);
  }
}

async function listCombinationRules(req, res, next) {
  try {
    const result = await db.query(
      `SELECT r.id, r.name, r.symptom_ids, r.cid10_id, c.code AS cid_code,
              c.description AS cid_description, r.score_bonus, r.notes, r.active,
              COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name)
                FILTER (WHERE s.id IS NOT NULL), '[]') AS symptoms
         FROM symptom_combination_rules r
         JOIN cid10_codes c ON c.id = r.cid10_id
         LEFT JOIN LATERAL unnest(r.symptom_ids) symptom_id ON TRUE
         LEFT JOIN symptoms s ON s.id = symptom_id
        GROUP BY r.id, c.code, c.description
        ORDER BY r.active DESC, r.name`
    );
    res.json({ rules: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createCombinationRule(req, res, next) {
  try {
    const input = combinationRuleSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO symptom_combination_rules
        (name, symptom_ids, cid10_id, score_bonus, notes, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      combinationRuleValues(input)
    );
    await log(req, 'CREATE_SYMPTOM_COMBINATION_RULE', 'symptom_combination_rules', result.rows[0].id, result.rows[0]);
    res.status(201).json({ rule: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateCombinationRule(req, res, next) {
  try {
    const input = combinationRuleSchema.parse(req.body);
    const result = await db.query(
      `UPDATE symptom_combination_rules
          SET name = $1, symptom_ids = $2, cid10_id = $3, score_bonus = $4,
              notes = $5, active = $6, updated_at = now()
        WHERE id = $7
        RETURNING *`,
      [...combinationRuleValues(input), req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Regra nao encontrada.' });
    await log(req, 'UPDATE_SYMPTOM_COMBINATION_RULE', 'symptom_combination_rules', result.rows[0].id, result.rows[0]);
    res.json({ rule: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function removeCombinationRule(req, res, next) {
  try {
    const result = await db.query('DELETE FROM symptom_combination_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Regra nao encontrada.' });
    await log(req, 'DELETE_SYMPTOM_COMBINATION_RULE', 'symptom_combination_rules', result.rows[0].id, {});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function groupValues(input) {
  return [
    normalizeCode(input.code),
    input.name.trim(),
    clean(input.description),
    input.sortOrder ?? 0,
    input.active ?? true
  ];
}

function symptomValues(input) {
  return [
    input.groupId,
    normalizeCode(input.code),
    input.name.trim(),
    normalizeKeywords(input.keywords),
    input.sortOrder ?? 0,
    input.active ?? true
  ];
}

function combinationRuleValues(input) {
  return [
    input.name.trim(),
    [...new Set(input.symptomIds)],
    input.cid10Id,
    input.scoreBonus,
    clean(input.notes),
    input.active ?? true
  ];
}

function normalizeKeywords(values) {
  return [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))];
}

function candidateOrderBy(sort) {
  const options = {
    symptom_asc: 's.name ASC, c.code ASC',
    symptom_desc: 's.name DESC, c.code ASC',
    cid_asc: 'c.code ASC, s.name ASC',
    cid_desc: 'c.code DESC, s.name ASC',
    score_desc: 'cand.suggested_score DESC, s.name ASC, c.code ASC',
    score_asc: 'cand.suggested_score ASC, s.name ASC, c.code ASC',
    created_desc: 'cand.created_at DESC, s.name ASC',
    created_asc: 'cand.created_at ASC, s.name ASC'
  };
  return options[sort] || options.created_desc;
}

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
}

function clean(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

async function log(req, action, entity, entityId, metadata) {
  await db.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.username || 'Admin', action, entity, entityId, JSON.stringify(metadata)]
  );
}

module.exports = {
  listGroups,
  createGroup,
  updateGroup,
  removeGroup,
  listSymptoms,
  createSymptom,
  updateSymptom,
  removeSymptom,
  listLinks,
  createLink,
  updateLink,
  removeLink,
  generateCandidates,
  listCandidates,
  reviewCandidate,
  listCombinationRules,
  createCombinationRule,
  updateCombinationRule,
  removeCombinationRule
};
