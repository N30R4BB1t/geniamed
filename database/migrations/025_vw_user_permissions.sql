CREATE OR REPLACE VIEW vw_user_permissions AS

SELECT

    u.id AS user_id,

    u.full_name,

    r.name AS role_name,

    p.code AS permission_code

FROM users u

INNER JOIN roles r
    ON r.id = u.role_id

INNER JOIN role_permissions rp
    ON rp.role_id = r.id

INNER JOIN permissions p
    ON p.id = rp.permission_id;