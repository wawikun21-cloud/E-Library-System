const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  /**
   * Generate JWT token
   * @private
   */
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  /**
   * Login handler
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Verify credentials
      const user = await User.verifyCredentials(username, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const token = AuthController.generateToken(user.user_id);

      // Update last login
      await User.updateLastLogin(user.user_id);

      // Log login activity
      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(user.user_id, 'LOGIN', 'User logged in', ipAddress);

      // Send success response with token
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          last_login: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login. Please try again.',
        code: 'LOGIN_ERROR'
      });
    }
  }

  /**
   * Logout handler
   * POST /api/auth/logout
   * Protected: requires authentication
   */
  static async logout(req, res) {
    try {
      // User data available from authenticate middleware
      if (req.user) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await User.logActivity(req.user.userId, 'LOGOUT', 'User logged out', ipAddress);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during logout',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   * Protected: requires authentication
   */
  static async getCurrentUser(req, res) {
    try {
      // User already verified by authenticate middleware
      // Fetch fresh user data
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user data',
        code: 'FETCH_USER_ERROR'
      });
    }
  }

  /**
   * Verify session/token
   * POST /api/auth/verify
   * Protected: requires authentication
   */
  static async verifySession(req, res) {
    try {
      // ✅ CRITICAL FIX: Fetch full user data from database
      // req.user only contains { userId, username } from JWT payload
      // We need complete user data including full_name, email, role
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Return complete user data
      res.json({
        success: true,
        valid: true,
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        }
      });
    } catch (error) {
      console.error('Session verification error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during session verification',
        code: 'VERIFY_ERROR'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   * Protected: requires authentication
   */
  static async updateProfile(req, res) {
    try {
      const { fullName, username } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!fullName || !username) {
        return res.status(400).json({
          success: false,
          message: 'Full name and username are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Check if username is already taken by another user
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken',
          code: 'USERNAME_TAKEN'
        });
      }

      // Update profile
      await User.updateProfile(userId, fullName, username);

      // ✅ FIX: Get updated user data to return in response
      const updatedUser = await User.findById(userId);

      // Log activity
      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(userId, 'PROFILE_UPDATE', 'Profile information updated', ipAddress);

      // ✅ FIX: Return complete updated user data
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          user_id: updatedUser.user_id,
          username: updatedUser.username,
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          role: updatedUser.role,
          last_login: updatedUser.last_login
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  }

  /**
   * Update password
   * PUT /api/auth/password
   * Protected: requires authentication
   */
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
          code: 'MISSING_FIELDS'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      // Get user with password
      const user = await User.findByUsername(req.user.username);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      if (user.password !== currentPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INCORRECT_PASSWORD'
        });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      // Log activity
      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(userId, 'PASSWORD_CHANGE', 'Password changed', ipAddress);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update password',
        code: 'UPDATE_PASSWORD_ERROR'
      });
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   * Protected: requires authentication
   */
  static async refreshToken(req, res) {
    try {
      // Generate new token
      const newToken = AuthController.generateToken(req.user.userId);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: newToken
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        code: 'REFRESH_ERROR'
      });
    }
  }
}

module.exports = AuthController;