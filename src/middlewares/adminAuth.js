const { verify } = require('../services/tokenService');

function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verify(token);

  if (!payload || payload.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Acesso administrativo nao autorizado.' });
  }

  req.user = payload;
  next();
}

module.exports = { adminAuth };

