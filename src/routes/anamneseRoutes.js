const express =
    require('express');

const router =
    express.Router();

const authMiddleware =
    require('../middlewares/authMiddleware');

const permissionMiddleware =
    require('../middlewares/permissionMiddleware');

const AnamneseController =
    require('../controllers/AnamneseController');

router.use(authMiddleware);

router.post(

    '/',

    permissionMiddleware(
        'anamnese.create'
    ),

    AnamneseController.create

);

router.put(

    '/:id',

    permissionMiddleware(
        'anamnese.update'
    ),

    AnamneseController.update

);

router.get(

    '/:id',

    permissionMiddleware(
        'anamnese.read'
    ),

    AnamneseController.findById

);

router.get(

    '/patient/:patientId',

    permissionMiddleware(
        'anamnese.read'
    ),

    AnamneseController.findByPatient

);

router.get(

    '/patient/:patientId/history',

    permissionMiddleware(
        'anamnese.read'
    ),

    AnamneseController.history

);

module.exports = router;