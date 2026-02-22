const db = require('../config/database');

class Book {
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: NORMALIZE ISBN
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Normalize ISBN to consistent format
   * Removes hyphens, spaces, and non-alphanumeric characters
   * Preserves 'X' for ISBN-10 check digit
   * 
   * @param {string} isbn - Raw ISBN string
   * @returns {string|null} - Normalized ISBN or null
   */
  static normalizeISBN(isbn) {
    if (!isbn) return null;
    
    // Remove all non-alphanumeric except X (for ISBN-10)
    // Convert to uppercase, trim, limit to 13 chars
    const normalized = isbn
      .trim()
      .toUpperCase()
      .replace(/[^0-9X]/gi, '')
      .substring(0, 13);
    
    return normalized || null;
  }

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

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADED: CREATE WITH ISBN NORMALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
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

      // ═════════════════════════════════════════════════════════════════════
      // NORMALIZE ISBN before insert
      // ═════════════════════════════════════════════════════════════════════
      const normalizedISBN = Book.normalizeISBN(isbn);
      
      if (!normalizedISBN) {
        throw new Error('Invalid ISBN format');
      }

      console.log('📖 Creating book with normalized ISBN:', {
        original: isbn,
        normalized: normalizedISBN
      });

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
          normalizedISBN,  // ← Use normalized version
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

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADED: UPDATE WITH ISBN NORMALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
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

      // ═════════════════════════════════════════════════════════════════════
      // NORMALIZE ISBN before update
      // ═════════════════════════════════════════════════════════════════════
      const normalizedISBN = Book.normalizeISBN(isbn);
      
      if (!normalizedISBN) {
        throw new Error('Invalid ISBN format');
      }

      console.log('📖 Updating book with normalized ISBN:', {
        original: isbn,
        normalized: normalizedISBN
      });

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
          normalizedISBN,  // ← Use normalized version
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

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADED: ISBN EXISTS CHECK WITH NORMALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check if ISBN already exists (with normalization)
   * 
   * @param {string} isbn - ISBN to check
   * @param {number} excludeBookId - Book ID to exclude (for updates)
   * @returns {boolean} - True if exists
   */
  static async isbnExists(isbn, excludeBookId = null) {
    try {
      // ═════════════════════════════════════════════════════════════════════
      // NORMALIZE ISBN for consistent comparison
      // ═════════════════════════════════════════════════════════════════════
      const normalizedISBN = Book.normalizeISBN(isbn);
      
      if (!normalizedISBN) {
        console.warn('⚠️ Invalid ISBN format in isbnExists check:', isbn);
        return false;
      }

      // Normalize database ISBNs using REPLACE() for comparison
      // This handles cases where database has hyphens or spaces
      let query = `
        SELECT book_id, isbn, title
        FROM books 
        WHERE REPLACE(REPLACE(REPLACE(UPPER(isbn), '-', ''), ' ', ''), '\n', '') = ? 
          AND is_active = 1
      `;
      let params = [normalizedISBN];

      if (excludeBookId) {
        query += ' AND book_id != ?';
        params.push(excludeBookId);
      }

      const [rows] = await db.query(query, params);
      
      if (rows.length > 0) {
        console.log('📖 ISBN exists check:', {
          searchedISBN: isbn,
          normalizedISBN: normalizedISBN,
          foundBook: rows[0].title,
          foundISBN: rows[0].isbn
        });
      }
      
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