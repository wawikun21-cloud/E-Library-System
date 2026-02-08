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
}

module.exports = AuthController;
