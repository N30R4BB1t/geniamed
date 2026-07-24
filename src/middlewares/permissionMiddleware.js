const db = require('../config/database');

module.exports =
(permissionCode) => {

    return async (
        req,
        res,
        next
    ) => {

        if (req.user && req.user.role === 'ADMIN') {
            return next();
        }

        const userId = req.user.id;

        const query = `
            SELECT 1

            FROM vw_user_permissions

            WHERE user_id = $1
              AND permission_code = $2

            LIMIT 1
        `;

        const { rows } =
            await db.query(
                query,
                [
                    userId,
                    permissionCode
                ]
            );

        if (!rows.length) {

            return res
                .status(403)
                .json({
                    error:
                        'Sem permissão'
                });
        }

        next();

    };

};