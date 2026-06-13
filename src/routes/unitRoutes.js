const router = require('express').Router();
const controller = require('../controllers/unitController');

router.post('/nearby', controller.findNearby);
router.get('/', controller.listUnits);

module.exports = router;

