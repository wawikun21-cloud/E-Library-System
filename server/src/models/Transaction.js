const db = require('../config/database');

class Transaction {
  // Get all transactions with book details (no student join needed)
  static async getAll() {
    try {
      const [rows] = await db.query(
        `SELECT 
          t.transaction_id,
          t.book_id,
          t.student_name,
          t.student_id_number,
          t.course,
          t.year_level,
          t.address,
          t.contact_number,
          t.email,
          t.borrowed_date,
          t.due_date,
          t.return_date,
          t.status,
          t.notes,
          t.created_at,
          b.title as book_title,
          b.author as book_author,
          b.isbn,
          b.cover_image
        FROM transactions t
        LEFT JOIN books b ON t.book_id = b.book_id
        ORDER BY t.created_at DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error in Transaction.getAll:', error);
      throw error;
    }
  }

  // Get transaction by ID
  static async getById(transactionId) {
    try {
      const [rows] = await db.query(
        `SELECT 
          t.transaction_id,
          t.book_id,
          t.student_name,
          t.student_id_number,
          t.course,
          t.year_level,
          t.address,
          t.contact_number,
          t.email,
          t.borrowed_date,
          t.due_date,
          t.return_date,
          t.status,
          t.notes,
          b.title as book_title,
          b.author as book_author
        FROM transactions t
        LEFT JOIN books b ON t.book_id = b.book_id
        WHERE t.transaction_id = ?`,
        [transactionId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in Transaction.getById:', error);
      throw error;
    }
  }

  // Create new transaction (borrow book) with embedded student data
  static async create(transactionData, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        book_id,
        student_name,
        student_id_number,
        course,
        year_level,
        address,
        contact_number,
        email,
        borrowed_date,
        due_date,
        notes
      } = transactionData;

      // Check if book is available
      const [bookRows] = await connection.query(
        'SELECT available_quantity FROM books WHERE book_id = ? AND is_active = 1',
        [book_id]
      );

      if (!bookRows[0] || bookRows[0].available_quantity <= 0) {
        throw new Error('Book is not available for borrowing');
      }

      // Create transaction with embedded student data
      const [result] = await connection.query(
        `INSERT INTO transactions (
          book_id, 
          student_name,
          student_id_number,
          course,
          year_level,
          address,
          contact_number,
          email,
          borrowed_date, 
          due_date, 
          status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          book_id, 
          student_name,
          student_id_number,
          course || null,
          year_level || null,
          address || null,
          contact_number || null,
          email || null,
          borrowed_date, 
          due_date, 
          notes || null
        ]
      );

      // Decrease available quantity
      await connection.query(
        'UPDATE books SET available_quantity = available_quantity - 1 WHERE book_id = ?',
        [book_id]
      );

      // Log activity
      if (userId) {
        try {
          await connection.query(
            `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
             VALUES (?, 'BORROW_BOOK', 'transactions', ?, ?)`,
            [userId, result.insertId, `Book borrowed by: ${student_name} (${student_id_number})`]
          );
        } catch (logError) {
          console.warn('⚠️ Activity logging failed:', logError.message);
        }
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error in Transaction.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Return book
  static async returnBook(transactionId, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get transaction details
      const [transactionRows] = await connection.query(
        'SELECT book_id, status, student_name FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );

      if (!transactionRows[0]) {
        throw new Error('Transaction not found');
      }

      if (transactionRows[0].status === 'returned') {
        throw new Error('Book already returned');
      }

      const { book_id, student_name } = transactionRows[0];

      // Update transaction
      await connection.query(
        `UPDATE transactions 
         SET status = 'returned', 
             return_date = CURDATE(),
             updated_at = CURRENT_TIMESTAMP
         WHERE transaction_id = ?`,
        [transactionId]
      );

      // Increase available quantity
      await connection.query(
        'UPDATE books SET available_quantity = available_quantity + 1 WHERE book_id = ?',
        [book_id]
      );

      // Log activity
      if (userId) {
        try {
          await connection.query(
            `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
             VALUES (?, 'RETURN_BOOK', 'transactions', ?, ?)`,
            [userId, transactionId, `Book returned by: ${student_name}`]
          );
        } catch (logError) {
          console.warn('⚠️ Activity logging failed:', logError.message);
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error in Transaction.returnBook:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Extend due date
  static async extendDueDate(transactionId, newDueDate, userId) {
    try {
      // Check transaction exists and is active
      const [rows] = await db.query(
        'SELECT status, student_name FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );

      if (!rows[0]) {
        throw new Error('Transaction not found');
      }

      if (rows[0].status === 'returned') {
        throw new Error('Cannot extend due date for returned book');
      }

      // Update due date
      await db.query(
        `UPDATE transactions 
         SET due_date = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE transaction_id = ?`,
        [newDueDate, transactionId]
      );

      // Log activity
      if (userId) {
        try {
          await db.query(
            `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
             VALUES (?, 'EXTEND_DUE_DATE', 'transactions', ?, ?)`,
            [userId, transactionId, `Due date extended to ${newDueDate} for ${rows[0].student_name}`]
          );
        } catch (logError) {
          console.warn('⚠️ Activity logging failed:', logError.message);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error in Transaction.extendDueDate:', error);
      throw error;
    }
  }

  // Update overdue status
  static async updateOverdueStatus() {
    try {
      const [result] = await db.query(
        `UPDATE transactions 
         SET status = 'overdue'
         WHERE status = 'active' 
         AND due_date < CURDATE()
         AND return_date IS NULL`
      );

      return result.affectedRows;
    } catch (error) {
      console.error('❌ Error in Transaction.updateOverdueStatus:', error);
      throw error;
    }
  }

  // Get statistics
  static async getStats() {
    try {
      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_count
        FROM transactions`
      );
      return stats[0];
    } catch (error) {
      console.error('Error in Transaction.getStats:', error);
      throw error;
    }
  }

  // Search transactions
  static async search(searchTerm) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await db.query(
        `SELECT 
          t.transaction_id,
          t.book_id,
          t.student_name,
          t.student_id_number,
          t.course,
          t.year_level,
          t.borrowed_date,
          t.due_date,
          t.return_date,
          t.status,
          t.notes,
          b.title as book_title,
          b.author as book_author,
          b.isbn
        FROM transactions t
        LEFT JOIN books b ON t.book_id = b.book_id
        WHERE b.title LIKE ? 
        OR t.student_name LIKE ? 
        OR t.student_id_number LIKE ?
        OR t.transaction_id LIKE ?
        ORDER BY t.created_at DESC`,
        [searchPattern, searchPattern, searchPattern, searchPattern]
      );
      return rows;
    } catch (error) {
      console.error('Error in Transaction.search:', error);
      throw error;
    }
  }

  // Get unique borrowers (for statistics/reports)
  static async getUniqueBorrowers() {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT 
          student_id_number,
          student_name,
          course,
          year_level,
          COUNT(*) as total_borrows
        FROM transactions
        GROUP BY student_id_number, student_name, course, year_level
        ORDER BY total_borrows DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error in Transaction.getUniqueBorrowers:', error);
      throw error;
    }
  }
}

module.exports = Transaction;