const router = require('express').Router();
const controller = require('../controllers/dashboardController');
const { allowRoles } = require('../middlewares/auth');
const { audit } = require('../middlewares/audit');

router.use(...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM', 'RECEPCAO'));
router.use(audit('OPERATIONAL_DASHBOARD_ACCESS', 'occurrences'));
router.get('/occurrences', controller.listOccurrences);
router.get('/events', controller.events);

module.exports = router;
