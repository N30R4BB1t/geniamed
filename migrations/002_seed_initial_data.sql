INSERT INTO app_users (username, password_hash, full_name, role, active)
VALUES (
  'Admin',
  crypt('Admin123', gen_salt('bf')),
  'Administrador do Sistema',
  'ADMIN',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO patients (id, full_name, cpf, birth_date, sex, phone, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Maria Silva Santos', '123.456.789-00', '1984-05-12', 'F', '+55 11 99999-0001', 'maria@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Joao Pereira Lima', '987.654.321-00', '1976-09-03', 'M', '+55 11 99999-0002', 'joao@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_qr_tokens (patient_id, token_hash, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', encode(digest('CARTAO-MARIA-001', 'sha256'), 'hex'), TRUE),
  ('22222222-2222-2222-2222-222222222222', encode(digest('CARTAO-JOAO-001', 'sha256'), 'hex'), TRUE)
ON CONFLICT (token_hash) DO NOTHING;

INSERT INTO hospital_histories (patient_id, allergies, chronic_conditions, current_medications, blood_type, notes)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dipirona', 'Hipertensao', 'Losartana 50mg', 'O+', 'Paciente relata historico familiar cardiovascular.'),
  ('22222222-2222-2222-2222-222222222222', 'Nenhuma conhecida', 'Diabetes tipo 2', 'Metformina 850mg', 'A+', 'Acompanhamento endocrinologico regular.')
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO units (id, name, address, city, state, phone, latitude, longitude)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HFOA', 'Rua Dr. Miguel Couto, 70, Jardim Amália', 'Volta Redonda', 'RJ', '+55 24 2102-2121', -22.5108850, -44.0821690),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hospital Nelson dos Santos Gonçalves', 'Rua Paulo Leopoldo Marçal, 298, Aterrado', 'Volta Redonda', 'RJ', '+55 24 3152-8500', -22.5085220, -44.0903690),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Hospital São João Batista', 'Av. Nossa Senhora das Graças, 235, Colina', 'Volta Redonda', 'RJ', '+55 24 3152-8300', -22.5150540, -44.0880980)
ON CONFLICT (id) DO NOTHING;

INSERT INTO unit_capabilities (unit_id, need, category, subcategory, min_priority, notes)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMERGENCIA', 'DOR', 'DOR_NO_PEITO', 'CRITICA', 'Pronto-socorro cardiologico 24h'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMERGENCIA', 'TRAUMA', 'FRATURA', 'ALTA', 'Ortopedia e imagem'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMERGENCIA', 'FERIMENTO', 'CORTE_LESAO', 'MEDIA', 'Sutura e centro cirurgico'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EMERGENCIA', 'DOR', 'DOR_ABDOMINAL', 'ALTA', 'Clinica medica e cirurgia geral'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EMERGENCIA', 'TRAUMA', 'QUEDA', 'MEDIA', 'Observacao e raio-x'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CONSULTA', NULL, NULL, 'BAIXA', 'Consultas ambulatoriais'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'AGENDAMENTO', NULL, NULL, 'BAIXA', 'Central de agendamento'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'EXAME', NULL, NULL, 'BAIXA', 'Coleta e exames simples')
ON CONFLICT DO NOTHING;

