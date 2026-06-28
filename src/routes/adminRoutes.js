const router = require('express').Router();
const { adminAuth } = require('../middlewares/adminAuth');
const { requireCsrf } = require('../middlewares/auth');
const { audit } = require('../middlewares/audit');
const unitController = require('../controllers/adminUnitController');
const capabilityController = require('../controllers/adminCapabilityController');
const userController = require('../controllers/adminUserController');
const protocolController = require('../controllers/adminProtocolController');
const trackingController = require('../controllers/adminTrackingController');
const cidController = require('../controllers/cidController');
const symptomController = require('../controllers/adminSymptomController');

router.use(adminAuth);
router.use(requireCsrf);
router.use(audit('ADMIN_ACCESS', 'administration'));

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

router.get('/cid10/stats', cidController.stats);
router.post('/cid10/import', cidController.importCsv);

router.get('/symptom-groups', symptomController.listGroups);
router.post('/symptom-groups', symptomController.createGroup);
router.put('/symptom-groups/:id', symptomController.updateGroup);
router.delete('/symptom-groups/:id', symptomController.removeGroup);

router.get('/symptoms', symptomController.listSymptoms);
router.post('/symptoms', symptomController.createSymptom);
router.put('/symptoms/:id', symptomController.updateSymptom);
router.delete('/symptoms/:id', symptomController.removeSymptom);

router.get('/symptom-cid-links', symptomController.listLinks);
router.post('/symptom-cid-links', symptomController.createLink);
router.put('/symptom-cid-links/:id', symptomController.updateLink);
router.delete('/symptom-cid-links/:id', symptomController.removeLink);

router.post('/symptom-cid-candidates/generate', symptomController.generateCandidates);
router.get('/symptom-cid-candidates', symptomController.listCandidates);
router.post('/symptom-cid-candidates/:id/review', symptomController.reviewCandidate);

router.get('/symptom-combination-rules', symptomController.listCombinationRules);
router.post('/symptom-combination-rules', symptomController.createCombinationRule);
router.put('/symptom-combination-rules/:id', symptomController.updateCombinationRule);
router.delete('/symptom-combination-rules/:id', symptomController.removeCombinationRule);

module.exports = router;
