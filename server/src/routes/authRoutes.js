const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// POST /api/auth/verify
router.post('/verify', AuthController.verifySession);

// PUT /api/auth/profile - Update user profile
router.put('/profile', AuthController.updateProfile);

// PUT /api/auth/password - Update password
router.put('/password', AuthController.updatePassword);

module.exports = router;