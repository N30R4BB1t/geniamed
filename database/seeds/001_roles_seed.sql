INSERT INTO roles
(name, description)

SELECT
    'ADMIN',
    'Administrador do Sistema'

WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE name = 'ADMIN'
);

INSERT INTO roles
(name, description)

SELECT
    'MEDICO',
    'Médico'

WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE name = 'MEDICO'
);

INSERT INTO roles
(name, description)

SELECT
    'ENFERMEIRO',
    'Enfermeiro'

WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE name = 'ENFERMEIRO'
);

INSERT INTO roles
(name, description)

SELECT
    'TECNICO',
    'Técnico de Enfermagem'

WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE name = 'TECNICO'
);

INSERT INTO roles
(name, description)

SELECT
    'RECEPCIONISTA',
    'Recepcionista'

WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE name = 'RECEPCIONISTA'
);