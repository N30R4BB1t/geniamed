const router = require('express').Router();
const controller = require('../controllers/occurrenceController');
const trackingController = require('../controllers/trackingController');
const { allowRoles, requireCsrf } = require('../middlewares/auth');
const { patientAuth } = require('../middlewares/patientAuth');
const { rateLimit } = require('../middlewares/rateLimit');
const { audit } = require('../middlewares/audit');

router.get('/types', controller.getTypes);
router.post('/', rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }), patientAuth, controller.createOccurrence);
router.patch(
  '/:id/status',
  ...allowRoles('ADMIN', 'MEDICO', 'ENFERMAGEM', 'RECEPCAO'),
  requireCsrf,
  audit('OCCURRENCE_STATUS_CHANGE', 'occurrences'),
  controller.updateStatus
);
router.post('/:id/location', rateLimit({ windowMs: 60 * 1000, max: 10 }), trackingController.updateLocation);
router.post(
  '/:id/unit-suggestions/:suggestionId/respond',
  rateLimit({ windowMs: 5 * 60 * 1000, max: 20 }),
  trackingController.respondSuggestion
);

module.exports = router;
