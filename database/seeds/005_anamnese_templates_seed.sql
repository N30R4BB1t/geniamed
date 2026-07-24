INSERT INTO anamnese_templates (

    name,
    specialty,

    chief_complaint_template,

    history_present_illness_template,

    personal_history_template,

    family_history_template,

    medication_history_template,

    allergy_history_template,

    social_history_template,

    review_of_systems_template,

    observations_template

)

VALUES (

    'Clínica Geral',

    'CLINICA_GERAL',

    '',

    '',

    'Hipertensão: \nDiabetes: \nCirurgias prévias: \nInternações:',

    'Pai: \nMãe: \nIrmãos:',

    'Medicamentos em uso:',

    'Alergias conhecidas:',

    'Tabagismo: \nEtilismo: \nAtividade física:',

    'Cardiovascular: \nRespiratório: \nDigestivo: \nNeurológico:',

    ''

)

ON CONFLICT (name)
DO NOTHING;

INSERT INTO anamnese_templates (

    name,
    specialty,

    personal_history_template,

    family_history_template,

    observations_template

)

VALUES (

    'Pediatria',

    'PEDIATRIA',

    'Gestação: \nParto: \nVacinação: \nDesenvolvimento neuropsicomotor:',

    'Doenças hereditárias:',

    'Curva de crescimento adequada:'

)

ON CONFLICT (name)
DO NOTHING;

INSERT INTO anamnese_templates (

    name,
    specialty,

    personal_history_template,

    review_of_systems_template

)

VALUES (

    'Cardiologia',

    'CARDIOLOGIA',

    'Hipertensão: \nDislipidemia: \nInfarto prévio: \nInsuficiência cardíaca:',

    'Dor torácica: \nDispneia: \nPalpitações: \nEdema:'

)

ON CONFLICT (name)
DO NOTHING;

INSERT INTO anamnese_templates (

    name,
    specialty,

    personal_history_template,

    observations_template

)

VALUES (

    'Psiquiatria',

    'PSIQUIATRIA',

    'Histórico psiquiátrico prévio: \nInternações psiquiátricas:',

    'Humor: \nAfeto: \nPensamento: \nPercepção:'

)

ON CONFLICT (name)
DO NOTHING;

INSERT INTO anamnese_templates (

    name,
    specialty,

    personal_history_template,

    observations_template

)

VALUES (

    'Ginecologia',

    'GINECOLOGIA',

    'Menarca: \nGestações: \nPartos: \nAbortos:',

    'Última menstruação:'

)

ON CONFLICT (name)
DO NOTHING;

