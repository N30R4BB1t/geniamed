const router = require('express').Router();
const { adminAuth } = require('../middlewares/adminAuth');
const unitController = require('../controllers/adminUnitController');

router.use(adminAuth);

router.get('/units', unitController.list);
router.get('/units/:id', unitController.getById);
router.post('/units', unitController.create);
router.put('/units/:id', unitController.update);
router.delete('/units/:id', unitController.remove);

module.exports = router;

