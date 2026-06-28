const db = require('../config/database');
const { requestIp } = require('../services/sessionService');

function audit(action, entity, entityId = (req) => req.params.id || null) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (!req.user || res.statusCode >= 400) return;
      const id = entityId(req);
      db.query(
        `INSERT INTO audit_logs
          (user_id, actor, action, entity, entity_id, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          req.user.id,
          req.user.username,
          action,
          entity,
          id,
          JSON.stringify({ method: req.method, path: req.originalUrl }),
          requestIp(req),
          String(req.headers['user-agent'] || '').slice(0, 500)
        ]
      ).catch((error) => console.error('Falha ao registrar auditoria:', error.message));
    });
    next();
  };
}

module.exports = { audit };

