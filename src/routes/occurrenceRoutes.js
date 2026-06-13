const router = require('express').Router();
const controller = require('../controllers/occurrenceController');

router.get('/types', controller.getTypes);
router.post('/', controller.createOccurrence);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;

