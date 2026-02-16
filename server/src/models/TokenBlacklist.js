const db = require('../config/database');

class TokenBlacklist {

  // Add a token JTI to the blacklist on logout
  static async add(jti, userId, expiresAt) {
    try {
      await db.query(
        `INSERT IGNORE INTO token_blacklist (jti, user_id, expires_at)
         VALUES (?, ?, ?)`,
        [jti, userId, expiresAt]
      );
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      throw error;
    }
  }

  // Check if a JTI is blacklisted
  static async isBlacklisted(jti) {
    try {
      const [rows] = await db.query(
        'SELECT id FROM token_blacklist WHERE jti = ? AND expires_at > NOW() LIMIT 1',
        [jti]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // Fail OPEN on DB error during check — token still validated by JWT signature
      return false;
    }
  }

  // Clean up expired tokens (call periodically or on server start)
  static async cleanup() {
    try {
      const [result] = await db.query(
        'DELETE FROM token_blacklist WHERE expires_at < NOW()'
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up token blacklist:', error);
      return 0;
    }
  }
}

module.exports = TokenBlacklist;
