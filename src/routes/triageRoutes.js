const express =
    require('express');

const router =
    express.Router();

const authMiddleware =
    require('../middlewares/authMiddleware');

const permissionMiddleware =
    require('../middlewares/permissionMiddleware');

const TriageController =
    require('../controllers/TriageController');

router.use(
    authMiddleware
);

router.post(

    '/',

    permissionMiddleware(
        'triage.create'
    ),

    TriageController.create

);

router.get(

    '/patient/:patientId',

    permissionMiddleware(
        'triage.read'
    ),

    TriageController.findByPatient

);

module.exports =
    router;