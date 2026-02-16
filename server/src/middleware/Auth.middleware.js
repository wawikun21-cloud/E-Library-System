const jwt            = require('jsonwebtoken');
const User           = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

const COOKIE_NAME = 'lexora_token';

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No session found. Please login.',
        code: 'NO_TOKEN',
      });
    }

    // 1. Verify JWT signature and expiry
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

    // 2. F-10 FIX: check token is not blacklisted (logged out)
    if (decoded.jti) {
      const blacklisted = await TokenBlacklist.isBlacklisted(decoded.jti);
      if (blacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Session has been invalidated. Please login again.',
          code: 'TOKEN_REVOKED',
        });
      }
    }

    // 3. Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or is inactive.',
        code: 'USER_NOT_FOUND',
      });
    }

    // 4. Attach user data and token metadata to request
    req.user = {
      userId:   user.user_id,
      username: user.username,
      fullName: user.full_name,
      email:    user.email,
      role:     user.role,
    };
    req.tokenJti = decoded.jti; // used by logout and refresh to blacklist
    req.tokenExp = decoded.exp; // unix timestamp — used to set blacklist expiry

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

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Skip blacklist check for optional auth — performance optimisation
      const user = await User.findById(decoded.userId);
      req.user = user
        ? { userId: user.user_id, username: user.username,
            fullName: user.full_name, email: user.email, role: user.role }
        : null;
      req.tokenJti = decoded.jti;
      req.tokenExp = decoded.exp;
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