const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'lexora_token';

// ── authenticate ──────────────────────────────────────────────────────────────
// F-05 FIX: reads JWT from httpOnly cookie instead of Authorization header
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from httpOnly cookie
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No session found. Please login.',
        code: 'NO_TOKEN',
      });
    }

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid session. Please login again.',
          code: 'INVALID_TOKEN',
        });
      }
      throw jwtError;
    }

    // 3. Verify user still exists and is active in the database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or is inactive.',
        code: 'USER_NOT_FOUND',
      });
    }

    // 4. Attach safe user data to request — role sourced from DB, not token
    req.user = {
      userId:   user.user_id,
      username: user.username,
      fullName: user.full_name,
      email:    user.email,
      role:     user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      code: 'AUTH_ERROR',
    });
  }
};

// ── optionalAuth ──────────────────────────────────────────────────────────────
// Continues even if no cookie — used for public routes that show extra data when logged in
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.userId);
      req.user = user
        ? { userId: user.user_id, username: user.username,
            fullName: user.full_name, email: user.email, role: user.role }
        : null;
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };