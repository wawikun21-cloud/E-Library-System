const db     = require('../config/database');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

class User {

  // ── Find user by username ──────────────────────────────────────────────────
  static async findByUsername(username) {
    try {
      const [rows] = await db.query(
        `SELECT user_id, username, full_name, email, role,
                password_hash, last_login, is_active
           FROM users
          WHERE username = ? AND is_active = 1`,
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  // ── Find user by ID (never returns password_hash) ─────────────────────────
  static async findById(userId) {
    try {
      const [rows] = await db.query(
        `SELECT user_id, username, full_name, email, role, last_login
           FROM users
          WHERE user_id = ? AND is_active = 1`,
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  // ── Verify credentials with bcrypt ────────────────────────────────────────
  // F-01 FIX: replaced plaintext === comparison with bcrypt.compare()
  static async verifyCredentials(username, password) {
    try {
      const user = await this.findByUsername(username);
      if (!user || !user.password_hash) return null;

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return null;

      // Strip the hash before returning — never expose it to controllers
      const { password_hash, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      console.error('Error in verifyCredentials:', error);
      throw error;
    }
  }

  // ── Update password (hashes before storing) ───────────────────────────────
  // F-01 FIX: hashes newPassword with bcrypt instead of storing plaintext
  static async updatePassword(userId, newPassword) {
    try {
      const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await db.query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
        [hash, userId]
      );
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  }

  // ── Verify current password (used by change-password flow) ───────────────
  static async verifyPassword(userId, plainPassword) {
    try {
      const [rows] = await db.query(
        'SELECT password_hash FROM users WHERE user_id = ? AND is_active = 1',
        [userId]
      );
      if (!rows[0] || !rows[0].password_hash) return false;
      return bcrypt.compare(plainPassword, rows[0].password_hash);
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      throw error;
    }
  }

  // ── Update last login timestamp ───────────────────────────────────────────
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

  // ── Update user profile ───────────────────────────────────────────────────
  static async updateProfile(userId, fullName, username) {
    try {
      await db.query(
        'UPDATE users SET full_name = ?, username = ?, updated_at = NOW() WHERE user_id = ?',
        [fullName, username, userId]
      );
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  // ── Log activity ──────────────────────────────────────────────────────────
  static async logActivity(userId, actionType, description, ipAddress = null) {
    try {
      await db.query(
        'INSERT INTO activity_logs (user_id, action_type, description, ip_address) VALUES (?, ?, ?, ?)',
        [userId, actionType, description, ipAddress]
      );
    } catch (error) {
      // Log failures must never crash the request
      console.error('Error in logActivity:', error);
    }
  }
}

module.exports = User;
