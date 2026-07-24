INSERT INTO permissions
(code, description)
VALUES

('patient.create', 'Criar paciente'),
('patient.read', 'Visualizar paciente'),
('patient.update', 'Atualizar paciente'),

('appointment.create', 'Criar agendamento'),
('appointment.read', 'Visualizar agendamento'),
('appointment.update', 'Atualizar agendamento'),

('triage.create', 'Criar triagem'),
('triage.read', 'Visualizar triagem'),

('anamnese.create', 'Criar anamnese'),
('anamnese.read', 'Visualizar anamnese'),

('consultation.create', 'Criar consulta'),
('consultation.read', 'Visualizar consulta'),

('prescription.create', 'Criar prescrição'),
('prescription.read', 'Visualizar prescrição'),

('attachment.upload', 'Enviar anexos'),
('attachment.read', 'Visualizar anexos'),

('audit.read', 'Visualizar auditoria'),

('user.create', 'Criar usuário'),
('user.read', 'Visualizar usuário'),
('user.update', 'Atualizar usuário');
