const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // adjust path if needed

router.post('/register', authController.registerSupplier);
router.post('/login', authController.loginSupplier);
router.get('/logout',authController.logout);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password-otp', authController.resetPasswordOTP);

module.exports = router;
