const router = require('express').Router();
const controller = require('../controllers/dashboardController');

router.get('/occurrences', controller.listOccurrences);
router.get('/events', controller.events);

module.exports = router;

