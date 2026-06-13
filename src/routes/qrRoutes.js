const router = require('express').Router();
const controller = require('../controllers/qrController');
const authController = require('../controllers/authController');

router.post('/qrcode', controller.identifyByQrCode);
router.post('/login', authController.login);

module.exports = router;
