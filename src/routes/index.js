const router = require('express').Router();

router.use('/auth', require('./qrRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/occurrences', require('./occurrenceRoutes'));
router.use('/units', require('./unitRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
