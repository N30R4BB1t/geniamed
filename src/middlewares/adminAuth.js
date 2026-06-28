function adminAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Acesso administrativo nao autorizado.' });
  }
  if (req.user.must_change_password) {
    return res.status(403).json({ error: 'Troca de senha obrigatoria.', code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso administrativo nao autorizado.' });
  }
  next();
}

module.exports = { adminAuth };
