const sessionService = require('../services/sessionService');

async function attachSession(req, res, next) {
  try {
    req.user = await sessionService.findSession(req);
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticacao obrigatoria.' });
  }

  if (req.user.must_change_password && !isPasswordChangeRoute(req)) {
    return res.status(403).json({
      error: 'Troca de senha obrigatoria.',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }

  next();
}

function allowRoles(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Seu perfil nao possui permissao para esta operacao.' });
      }
      next();
    }
  ];
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.user) return res.status(401).json({ error: 'Autenticacao obrigatoria.' });

  const token = req.headers['x-csrf-token'];
  if (!sessionService.verifyCsrf(req.user, token)) {
    return res.status(403).json({ error: 'Token de seguranca invalido. Atualize a pagina e tente novamente.' });
  }
  next();
}

function isPasswordChangeRoute(req) {
  return req.originalUrl === '/api/auth/change-password'
    || req.originalUrl === '/api/auth/logout'
    || req.originalUrl === '/api/auth/me';
}

module.exports = { allowRoles, attachSession, requireAuth, requireCsrf };

