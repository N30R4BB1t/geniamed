const { verify } = require('../services/tokenService');

function patientAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verify(token);

  if (!payload || payload.purpose !== 'PATIENT_ACCESS' || payload.patientId !== req.body.patientId) {
    return res.status(401).json({ error: 'Identificacao do paciente invalida ou expirada.' });
  }

  req.patient = payload;
  next();
}

module.exports = { patientAuth };
