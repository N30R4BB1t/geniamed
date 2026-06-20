const router = require('express').Router();
const controller = require('../controllers/clinicalController');

router.get('/triages', controller.listTriages);
router.post('/triages', controller.createTriage);

router.get('/anamneses', controller.listAnamneses);
router.post('/anamneses', controller.createAnamnesis);

router.get('/consultations', controller.listConsultations);
router.post('/consultations', controller.createConsultation);

router.get('/prescriptions', controller.listPrescriptions);
router.post('/prescriptions', controller.createPrescription);

router.get('/evolutions', controller.listEvolutions);
router.post('/evolutions', controller.createEvolution);

router.get('/attachments', controller.listAttachments);
router.post('/attachments', controller.createAttachment);

module.exports = router;
