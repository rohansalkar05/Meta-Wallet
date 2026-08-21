const express = require('express');
const router = express.Router();
const { signup, verifyOtp, login, getProfile } = require('../controllers/authController');
const { authenticateSession } = require('../middleware/authMiddleware');

// Auth Endpoints
router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/profile', authenticateSession, getProfile);

module.exports = router;
