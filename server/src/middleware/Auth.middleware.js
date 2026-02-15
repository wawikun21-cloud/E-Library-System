/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user data to request
 * 
 * Usage:
 *   const { authenticate } = require('../middleware/auth.middleware');
 *   router.get('/protected', authenticate, controller.method);
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError; // Re-throw unexpected errors
    }

    // 3. Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or is inactive.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 4. Attach user data to request object
    req.user = {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    };

    // 5. Continue to next middleware/controller
    next();

  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    
    // Don't expose internal errors to client
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication - continues even if no token
 * Useful for routes that work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user data
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: user.user_id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          role: user.role
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      // Invalid token, continue without user data
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('❌ Optional auth middleware error:', error);
    req.user = null;
    next(); // Continue even if error
  }
};

module.exports = {
  authenticate,
  optionalAuth
};