const User = require('../models/User');

class AuthController {
  // Login handler
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Verify credentials
      const user = await User.verifyCredentials(username, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Update last login
      await User.updateLastLogin(user.user_id);

      // Log login activity
      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(user.user_id, 'LOGIN', 'User logged in', ipAddress);

      // Send success response
      res.json({
        success: true,
        message: 'Login successful',
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
        message: 'An error occurred during login. Please try again.'
      });
    }
  }

  // Logout handler
  static async logout(req, res) {
    try {
      const { userId } = req.body;

      if (userId) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await User.logActivity(userId, 'LOGOUT', 'User logged out', ipAddress);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during logout'
      });
    }
  }

  // Verify session (check if user still exists and is active)
  static async verifySession(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Session invalid or user is inactive'
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
      console.error('Session verification error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during session verification'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { userId, fullName, username } = req.body;

      // Validation
      if (!userId || !fullName || !username) {
        return res.status(400).json({
          success: false,
          message: 'User ID, full name, and username are required'
        });
      }

      // Check if username is already taken by another user
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }

      // Update profile
      await User.updateProfile(userId, fullName, username);

      // Get updated user
      const updatedUser = await User.findById(userId);

      // Log activity
      const ipAddress = req.ip || req.connection.remoteAddress;
      await User.logActivity(userId, 'PROFILE_UPDATE', 'Profile information updated', ipAddress);

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
        message: 'Failed to update profile'
      });
    }
  }

  // Update password
  static async updatePassword(req, res) {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      // Validation
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'User ID, current password, and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password (plain text comparison)
      const userWithPassword = await User.findByUsername(user.username);
      if (userWithPassword.password !== currentPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
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
        message: 'Failed to update password'
      });
    }
  }
}

module.exports = AuthController;