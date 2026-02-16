const jwt            = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User           = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

const COOKIE_NAME = 'lexora_token';

const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:   parseDuration(process.env.JWT_EXPIRES_IN || '24h'),
  path:     '/',
});

function parseDuration(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match  = String(str).match(/^(\d+)([smhd])$/);
  return match ? parseInt(match[1]) * (units[match[2]] || 3600000) : 86400000;
}

class AuthController {

  // F-10 FIX: include jti (JWT ID) in every token so it can be blacklisted
  static generateToken(userId) {
    return jwt.sign(
      { userId, jti: uuidv4() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // POST /api/auth/login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS',
        });
      }

      const user = await User.verifyCredentials(username, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const token = AuthController.generateToken(user.user_id);
      await User.updateLastLogin(user.user_id);

      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(user.user_id, 'LOGIN', 'User logged in', ipAddress);

      res.cookie(COOKIE_NAME, token, cookieOptions());

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          user_id:    user.user_id,
          username:   user.username,
          full_name:  user.full_name,
          email:      user.email,
          role:       user.role,
          last_login: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login. Please try again.',
        code: 'LOGIN_ERROR',
      });
    }
  }

  // POST /api/auth/logout
  // F-10 FIX: blacklists the current token JTI so it can't be reused
  static async logout(req, res) {
    try {
      if (req.user && req.tokenJti) {
        // Blacklist the current token
        const expiresAt = new Date(req.tokenExp * 1000); // tokenExp set by middleware
        await TokenBlacklist.add(req.tokenJti, req.user.userId, expiresAt);

        const ipAddress = req.ip || req.connection.remoteAddress;
        await User.logActivity(req.user.userId, 'LOGOUT', 'User logged out', ipAddress);
      }

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path:     '/',
      });

      return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the cookie even if blacklist fails
      res.clearCookie(COOKIE_NAME, { httpOnly: true, path: '/' });
      return res.status(500).json({
        success: false,
        message: 'An error occurred during logout',
        code: 'LOGOUT_ERROR',
      });
    }
  }

  // GET /api/auth/me
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }
      return res.json({
        success: true,
        user: {
          user_id:    user.user_id,
          username:   user.username,
          full_name:  user.full_name,
          email:      user.email,
          role:       user.role,
          last_login: user.last_login,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user data',
        code: 'FETCH_USER_ERROR',
      });
    }
  }

  // POST /api/auth/verify
  static async verifySession(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }
      return res.json({
        success: true,
        valid: true,
        user: {
          user_id:    user.user_id,
          username:   user.username,
          full_name:  user.full_name,
          email:      user.email,
          role:       user.role,
          last_login: user.last_login,
        },
      });
    } catch (error) {
      console.error('Session verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during session verification',
        code: 'VERIFY_ERROR',
      });
    }
  }

  // PUT /api/auth/profile
  static async updateProfile(req, res) {
    try {
      const { fullName, username } = req.body;
      const userId = req.user.userId;

      if (!fullName || !username) {
        return res.status(400).json({
          success: false,
          message: 'Full name and username are required',
          code: 'MISSING_FIELDS',
        });
      }

      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken',
          code: 'USERNAME_TAKEN',
        });
      }

      await User.updateProfile(userId, fullName, username);
      const updatedUser = await User.findById(userId);

      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(userId, 'PROFILE_UPDATE', 'Profile information updated', ipAddress);

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          user_id:    updatedUser.user_id,
          username:   updatedUser.username,
          full_name:  updatedUser.full_name,
          email:      updatedUser.email,
          role:       updatedUser.role,
          last_login: updatedUser.last_login,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        code: 'UPDATE_PROFILE_ERROR',
      });
    }
  }

  // PUT /api/auth/password
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
          code: 'MISSING_FIELDS',
        });
      }

      if (newPassword.length < 12) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 12 characters',
          code: 'PASSWORD_TOO_SHORT',
        });
      }

      if (newPassword.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'Password must not exceed 128 characters',
          code: 'PASSWORD_TOO_LONG',
        });
      }

      const isMatch = await User.verifyPassword(userId, currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INCORRECT_PASSWORD',
        });
      }

      await User.updatePassword(userId, newPassword);

      // F-10: blacklist the current token so user must log in fresh
      if (req.tokenJti) {
        const expiresAt = new Date(req.tokenExp * 1000);
        await TokenBlacklist.add(req.tokenJti, userId, expiresAt);
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(userId, 'PASSWORD_CHANGE', 'Password changed', ipAddress);

      // Clear the cookie — user must login again with new password
      res.clearCookie(COOKIE_NAME, { httpOnly: true, path: '/' });

      return res.json({
        success: true,
        message: 'Password updated successfully. Please login again with your new password.',
      });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password',
        code: 'UPDATE_PASSWORD_ERROR',
      });
    }
  }

  // POST /api/auth/refresh
  // F-10 FIX: blacklists old token before issuing new one
  static async refreshToken(req, res) {
    try {
      // Blacklist the old token
      if (req.tokenJti) {
        const expiresAt = new Date(req.tokenExp * 1000);
        await TokenBlacklist.add(req.tokenJti, req.user.userId, expiresAt);
      }

      // Issue new token with fresh JTI
      const newToken = AuthController.generateToken(req.user.userId);
      res.cookie(COOKIE_NAME, newToken, cookieOptions());

      return res.json({ success: true, message: 'Token refreshed successfully' });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        code: 'REFRESH_ERROR',
      });
    }
  }
}

module.exports = AuthController;