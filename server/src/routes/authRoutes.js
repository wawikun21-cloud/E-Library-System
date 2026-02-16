const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware');
const {
  validateLogin,
  validateUpdateProfile,
  validateUpdatePassword,
} = require('../middleware/validation.middleware');

const getLoginLimiter = (req) => req.app.get('loginLimiter');

// Public
router.post('/login', (req, res, next) => {
  const limiter = getLoginLimiter(req);
  if (limiter) return limiter(req, res, next);
  next();
}, validateLogin, AuthController.login);

// Protected
router.post('/logout',   authenticate, AuthController.logout);
router.post('/verify',   authenticate, AuthController.verifySession);
router.get( '/me',       authenticate, AuthController.getCurrentUser);
router.put( '/profile',  authenticate, validateUpdateProfile,  AuthController.updateProfile);
router.put( '/password', authenticate, validateUpdatePassword, AuthController.updatePassword);
router.post('/refresh',  authenticate, AuthController.refreshToken);

module.exports = router;