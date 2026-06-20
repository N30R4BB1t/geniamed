const router = require('express').Router();
const controller = require('../controllers/occurrenceController');
const trackingController = require('../controllers/trackingController');

router.get('/types', controller.getTypes);
router.post('/', controller.createOccurrence);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/location', trackingController.updateLocation);
router.post('/:id/unit-suggestions/:suggestionId/respond', trackingController.respondSuggestion);

module.exports = router;
