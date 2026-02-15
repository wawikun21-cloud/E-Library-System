const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware');

router.post('/login', AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/verify', authenticate, AuthController.verifySession);
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/password', authenticate, AuthController.updatePassword);

module.exports = router;