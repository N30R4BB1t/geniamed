const router = require('express').Router();
const controller = require('../controllers/patientController');

router.get('/:id', controller.getPatient);
router.get('/:id/history', controller.getHistory);

module.exports = router;

