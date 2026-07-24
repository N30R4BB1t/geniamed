INSERT INTO risk_classifications (

    code,
    name,
    priority,
    max_wait_minutes,
    description

)

VALUES

(
    'VERMELHO',
    'Emergência',
    1,
    0,
    'Atendimento imediato'
),

(
    'LARANJA',
    'Muito Urgente',
    2,
    10,
    'Atendimento em até 10 minutos'
),

(
    'AMARELO',
    'Urgente',
    3,
    60,
    'Atendimento em até 60 minutos'
),

(
    'VERDE',
    'Pouco Urgente',
    4,
    120,
    'Atendimento em até 120 minutos'
),

(
    'AZUL',
    'Não Urgente',
    5,
    240,
    'Atendimento em até 240 minutos'
)

ON CONFLICT (code)
DO NOTHING;