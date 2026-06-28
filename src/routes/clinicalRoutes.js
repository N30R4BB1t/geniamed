const router = require('express').Router();
const controller = require('../controllers/clinicalController');
const cidController = require('../controllers/cidController');
const { allowRoles, requireAuth, requireCsrf } = require('../middlewares/auth');
const { audit } = require('../middlewares/audit');

router.use(requireAuth);
router.use(requireCsrf);
router.use(audit('CLINICAL_ACCESS', 'clinical_records'));

router.get('/triages', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.listTriages);
router.post('/triages', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.createTriage);
router.get('/anamneses', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.listAnamneses);
router.post('/anamneses', ...allowRoles('ADMIN', 'MEDICO'), controller.createAnamnesis);

router.get('/consultations', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.listConsultations);
router.post('/consultations', ...allowRoles('ADMIN', 'MEDICO'), controller.createConsultation);

router.get('/prescriptions', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.listPrescriptions);
router.post('/prescriptions', ...allowRoles('ADMIN', 'MEDICO'), controller.createPrescription);

router.get('/evolutions', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.listEvolutions);
router.post('/evolutions', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.createEvolution);

router.get('/attachments', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.listAttachments);
router.post('/attachments', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), controller.createAttachment);

router.get('/cid10/search', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), cidController.search);
router.get('/symptoms', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), cidController.listSymptoms);
router.post('/cid10/suggestions', ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM'), cidController.suggestBySymptoms);

module.exports = router;
