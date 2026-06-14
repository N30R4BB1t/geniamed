const router = require('express').Router();
const controller = require('../controllers/patientController');

router.get('/', controller.listPatients);
router.post('/', controller.createPatient);
router.get('/:id', controller.getPatient);
router.get('/:id/history', controller.getHistory);

module.exports = router;
