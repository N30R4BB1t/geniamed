const router = require('express').Router();
const { adminAuth } = require('../middlewares/adminAuth');
const unitController = require('../controllers/adminUnitController');
const capabilityController = require('../controllers/adminCapabilityController');
const userController = require('../controllers/adminUserController');
const protocolController = require('../controllers/adminProtocolController');
const trackingController = require('../controllers/adminTrackingController');

router.use(adminAuth);

router.get('/units', unitController.list);
router.get('/units/:id', unitController.getById);
router.post('/units', unitController.create);
router.put('/units/:id', unitController.update);
router.delete('/units/:id', unitController.remove);

router.get('/capabilities', capabilityController.list);
router.post('/capabilities', capabilityController.create);
router.put('/capabilities/:id', capabilityController.update);
router.delete('/capabilities/:id', capabilityController.remove);

router.get('/users', userController.list);
router.post('/users', userController.create);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.remove);

router.get('/protocols', protocolController.list);
router.post('/protocols', protocolController.create);
router.put('/protocols/:id', protocolController.update);
router.delete('/protocols/:id', protocolController.remove);

router.get('/tracking/active', trackingController.listActive);
router.post('/tracking/:id/location', trackingController.simulateLocation);
router.post('/tracking/:id/reset', trackingController.resetSimulation);

module.exports = router;
