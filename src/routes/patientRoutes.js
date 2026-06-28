const router = require('express').Router();
const controller = require('../controllers/patientController');
const { allowRoles, requireCsrf } = require('../middlewares/auth');
const { audit } = require('../middlewares/audit');

router.use(...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM', 'RECEPCAO'));
router.use(requireCsrf);
router.use(audit('PATIENT_RECORD_ACCESS', 'patients'));
router.get('/', controller.listPatients);
router.post('/', controller.createPatient);
router.get('/:id', controller.getPatient);
router.get('/:id/history', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.getHistory);

module.exports = router;
