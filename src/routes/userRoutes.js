const express =
    require('express');

const router =
    express.Router();

const UserController =
    require('../controllers/UserController');

const authMiddleware =
    require('../middlewares/authMiddleware');

const permissionMiddleware =
    require('../middlewares/permissionMiddleware');

router.post(
    '/',
    authMiddleware,

    permissionMiddleware(
        'user.create'
    ),

    UserController.create
);

module.exports =
    router;