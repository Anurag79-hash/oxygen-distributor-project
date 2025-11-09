const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // adjust path if needed

router.post('/register', authController.registerSupplier);
router.post('/login', authController.loginSupplier);
router.get('/logout',authController.logout);
module.exports = router;
