const jwt  = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {

  // ── Generate JWT token ────────────────────────────────────────────────────
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // ── POST /api/auth/login ──────────────────────────────────────────────────
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

      // verifyCredentials() now uses bcrypt.compare() internally
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

      // F-05: Set JWT as httpOnly cookie so the browser sends it automatically.
      // js-inaccessible → immune to XSS token theft.
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProduction,          // HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours (matches JWT_EXPIRES_IN)
      });

      return res.json({
        success: true,
        message: 'Login successful',
        token,                         // still returned for API clients / backwards compat
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

  // ── POST /api/auth/logout ─────────────────────────────────────────────────
  static async logout(req, res) {
    try {
      if (req.user) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await User.logActivity(req.user.userId, 'LOGOUT', 'User logged out', ipAddress);
      }
      // F-05: Clear the httpOnly cookie on logout
      res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax' });
      return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during logout',
        code: 'LOGOUT_ERROR',
      });
    }
  }

  // ── GET /api/auth/me ──────────────────────────────────────────────────────
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

  // ── POST /api/auth/verify ─────────────────────────────────────────────────
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

  // ── PUT /api/auth/profile ─────────────────────────────────────────────────
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

  // ── PUT /api/auth/password ────────────────────────────────────────────────
  // F-01 FIX: uses User.verifyPassword() (bcrypt.compare) instead of === 
  // F-07 FIX: minimum password length raised to 12 characters
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

      // F-07: enforce minimum 12 characters
      if (newPassword.length < 12) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 12 characters',
          code: 'PASSWORD_TOO_SHORT',
        });
      }

      // F-07: enforce maximum 128 characters (bcrypt silently truncates at 72 bytes)
      if (newPassword.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'Password must not exceed 128 characters',
          code: 'PASSWORD_TOO_LONG',
        });
      }

      // F-01 FIX: use bcrypt.compare via User.verifyPassword()
      const isMatch = await User.verifyPassword(userId, currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INCORRECT_PASSWORD',
        });
      }

      // updatePassword() now hashes before storing
      await User.updatePassword(userId, newPassword);

      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(userId, 'PASSWORD_CHANGE', 'Password changed', ipAddress);

      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password',
        code: 'UPDATE_PASSWORD_ERROR',
      });
    }
  }

  // ── POST /api/auth/refresh ────────────────────────────────────────────────
  static async refreshToken(req, res) {
    try {
      const newToken = AuthController.generateToken(req.user.userId);
      // F-05: Refresh the httpOnly cookie as well
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', newToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: newToken,
      });
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