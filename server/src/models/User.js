const db = require('../config/database');

class User {
  // Find user by username
  static async findByUsername(username) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const [rows] = await db.query(
        'SELECT user_id, username, full_name, email, role, last_login FROM users WHERE user_id = ? AND is_active = 1',
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  // Update last login timestamp
  static async updateLastLogin(userId) {
    try {
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
      throw error;
    }
  }

  // Verify user credentials (plain text password comparison)
  static async verifyCredentials(username, password) {
    try {
      const user = await this.findByUsername(username);
      
      if (!user) {
        return null;
      }

      // Direct password comparison (plain text)
      // Note: In production, you should use hashed passwords with bcrypt
      if (user.password === password) {
        // Don't return the password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }

      return null;
    } catch (error) {
      console.error('Error in verifyCredentials:', error);
      throw error;
    }
  }

  // Log activity
  static async logActivity(userId, actionType, description, ipAddress = null) {
    try {
      await db.query(
        'INSERT INTO activity_logs (user_id, action_type, description, ip_address) VALUES (?, ?, ?, ?)',
        [userId, actionType, description, ipAddress]
      );
    } catch (error) {
      console.error('Error in logActivity:', error);
      // Don't throw error for logging failures
    }
  }
}

module.exports = User;
