const express =
    require('express');

const router =
    express.Router();

const authMiddleware =
    require('../middlewares/authMiddleware');

const permissionMiddleware =
    require('../middlewares/permissionMiddleware');

const RiskClassificationRepository =
    require(
        '../repositories/RiskClassificationRepository'
    );

router.get(

    '/',

    authMiddleware,

    permissionMiddleware(
        'triage.read'
    ),

    async (req, res, next) => {

        try {

            const data =
                await RiskClassificationRepository.findAll();

            res.json(data);

        } catch (error) {

            next(error);

        }

    }

);

module.exports = router;