INSERT INTO symptom_groups (code, name, description, sort_order) VALUES
  ('CARDIOVASCULAR', 'Cardiovascular', 'Sinais e sintomas cardiovasculares.', 25)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = TRUE;

INSERT INTO symptoms (group_id, code, name, keywords, sort_order)
SELECT g.id, s.code, s.name, s.keywords, s.sort_order
FROM symptom_groups g
JOIN (VALUES
  ('CARDIOVASCULAR', 'PALPITACAO', 'Palpitacao', ARRAY['palpitacao','palpitacoes','palpitação','palpitações','taquicardia','batimento cardiaco'], 10),
  ('CARDIOVASCULAR', 'PRESSAO_ALTA', 'Pressao alta', ARRAY['pressao alta','pressão alta','hipertensao','hipertensão','hipertensiva'], 20),
  ('CARDIOVASCULAR', 'DOR_IRRADIANDO_BRACO', 'Dor irradiando para braco', ARRAY['dor toracica','dor torácica','dor no peito','angina','braco','braço'], 30),
  ('CARDIOVASCULAR', 'LABIOS_ARROXEADOS', 'Labios arroxeados', ARRAY['cianose','labios arroxeados','lábios arroxeados','arroxeado'], 40)
) AS s(group_code, code, name, keywords, sort_order) ON s.group_code = g.code
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  keywords = EXCLUDED.keywords,
  sort_order = EXCLUDED.sort_order,
  active = TRUE;
