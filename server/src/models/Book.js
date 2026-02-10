const db = require('../config/database');

class Book {
  // Get all active books
  static async getAll() {
    try {
      const [rows] = await db.query(
        `SELECT 
          book_id, 
          title, 
          author, 
          isbn, 
          quantity, 
          available_quantity, 
          cover_image,
          category,
          publisher,
          published_year,
          description,
          location,
          created_at,
          updated_at
        FROM books 
        WHERE is_active = 1 
        ORDER BY created_at DESC`
      );
      return rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  // Get book by ID
  static async getById(bookId) {
    try {
      const [rows] = await db.query(
        `SELECT 
          book_id, 
          title, 
          author, 
          isbn, 
          quantity, 
          available_quantity, 
          cover_image,
          category,
          publisher,
          published_year,
          description,
          location,
          created_at,
          updated_at
        FROM books 
        WHERE book_id = ? AND is_active = 1`,
        [bookId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  // Search books
  static async search(searchTerm) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await db.query(
        `SELECT 
          book_id, 
          title, 
          author, 
          isbn, 
          quantity, 
          available_quantity, 
          cover_image,
          category,
          publisher,
          published_year,
          description,
          location,
          created_at,
          updated_at
        FROM books 
        WHERE is_active = 1 
        AND (
          title LIKE ? OR 
          author LIKE ? OR 
          isbn LIKE ? OR
          category LIKE ?
        )
        ORDER BY created_at DESC`,
        [searchPattern, searchPattern, searchPattern, searchPattern]
      );
      return rows;
    } catch (error) {
      console.error('Error in search:', error);
      throw error;
    }
  }

  // Create new book - WITH IMPROVED ERROR HANDLING
  static async create(bookData, userId) {
    try {
      const {
        title,
        author,
        isbn,
        quantity,
        cover_image,
        category,
        publisher,
        published_year,
        description,
        location
      } = bookData;

      const [result] = await db.query(
        `INSERT INTO books (
          title, 
          author, 
          isbn, 
          quantity, 
          available_quantity, 
          cover_image,
          category,
          publisher,
          published_year,
          description,
          location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          author,
          isbn,
          quantity || 1,
          quantity || 1, // available_quantity starts same as quantity
          cover_image || null,
          category || null,
          publisher || null,
          published_year || null,
          description || null,
          location || null
        ]
      );

      // Log activity (with error handling to prevent crashes if table doesn't exist)
      if (userId) {
        try {
          await db.query(
            `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
             VALUES (?, 'ADD_BOOK', 'books', ?, ?)`,
            [userId, result.insertId, `Added book: ${title}`]
          );
        } catch (logError) {
          // Log the error but don't crash - book was still created successfully
          console.warn('⚠️ Activity logging failed (book was still created):', logError.message);
          console.warn('💡 Tip: Create the activity_logs table to enable logging');
        }
      }

      return result.insertId;
    } catch (error) {
      console.error('❌ Error in create:', error);
      throw error;
    }
  }

  // Update book - WITH IMPROVED ERROR HANDLING
  static async update(bookId, bookData, userId) {
    try {
      const {
        title,
        author,
        isbn,
        quantity,
        cover_image,
        category,
        publisher,
        published_year,
        description,
        location
      } = bookData;

      // Get current book to calculate available_quantity adjustment
      const currentBook = await this.getById(bookId);
      if (!currentBook) {
        throw new Error('Book not found');
      }

      // Calculate new available_quantity
      const quantityDiff = quantity - currentBook.quantity;
      const newAvailable = currentBook.available_quantity + quantityDiff;
      const finalAvailable = Math.max(0, newAvailable);

      await db.query(
        `UPDATE books SET 
          title = ?,
          author = ?,
          isbn = ?,
          quantity = ?,
          available_quantity = ?,
          cover_image = ?,
          category = ?,
          publisher = ?,
          published_year = ?,
          description = ?,
          location = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?`,
        [
          title,
          author,
          isbn,
          quantity,
          finalAvailable,
          cover_image || null,
          category || null,
          publisher || null,
          published_year || null,
          description || null,
          location || null,
          bookId
        ]
      );

      // Log activity (with error handling)
      if (userId) {
        try {
          await db.query(
            `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
             VALUES (?, 'UPDATE_BOOK', 'books', ?, ?)`,
            [userId, bookId, `Updated book: ${title}`]
          );
        } catch (logError) {
          console.warn('⚠️ Activity logging failed (book was still updated):', logError.message);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error in update:', error);
      throw error;
    }
  }

  // Soft delete book - WITH IMPROVED ERROR HANDLING
  static async delete(bookId, userId) {
    try {
      const book = await this.getById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      // Check if book has active borrowings
      const [borrowings] = await db.query(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE book_id = ? AND status IN ('active', 'overdue')`,
        [bookId]
      );

      if (borrowings[0].count > 0) {
        throw new Error('Cannot delete book with active borrowings');
      }

      // Soft delete
      await db.query(
        `UPDATE books SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE book_id = ?`,
        [bookId]
      );

      // Log activity (with error handling)
      if (userId) {
        try {
          await db.query(
            `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) 
             VALUES (?, 'DELETE_BOOK', 'books', ?, ?)`,
            [userId, bookId, `Deleted book: ${book.title}`]
          );
        } catch (logError) {
          console.warn('⚠️ Activity logging failed (book was still deleted):', logError.message);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error in delete:', error);
      throw error;
    }
  }

  // Check if ISBN already exists
  static async isbnExists(isbn, excludeBookId = null) {
    try {
      let query = 'SELECT book_id FROM books WHERE isbn = ? AND is_active = 1';
      let params = [isbn];

      if (excludeBookId) {
        query += ' AND book_id != ?';
        params.push(excludeBookId);
      }

      const [rows] = await db.query(query, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Error in isbnExists:', error);
      throw error;
    }
  }

  // Get book statistics
  static async getStats() {
    try {
      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as total_books,
          SUM(quantity) as total_copies,
          SUM(available_quantity) as available_copies,
          SUM(quantity - available_quantity) as borrowed_copies
        FROM books 
        WHERE is_active = 1`
      );
      return stats[0];
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }
}

module.exports = Book;