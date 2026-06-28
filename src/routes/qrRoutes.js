const router = require('express').Router();
const controller = require('../controllers/qrController');
const authController = require('../controllers/authController');
const { requireAuth, requireCsrf } = require('../middlewares/auth');
const { rateLimit } = require('../middlewares/rateLimit');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const qrLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 30 });

router.post('/qrcode', qrLimit, controller.identifyByQrCode);
router.post('/login', loginLimit, authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, requireCsrf, authController.logout);
router.post('/change-password', requireAuth, requireCsrf, authController.changePassword);

module.exports = router;
