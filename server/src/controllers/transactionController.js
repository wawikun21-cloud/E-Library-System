const Transaction = require('../models/Transaction');
const Book = require('../models/book');

class TransactionController {
  // Get all transactions
  static async getAllTransactions(req, res) {
    try {
      const transactions = await Transaction.getAll();
      
      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Get all transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  }

  // Get single transaction
  static async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.getById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction'
      });
    }
  }

  // Create new transaction (borrow book) with embedded student data
  static async createTransaction(req, res) {
    try {
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
      } = req.body;

      // Validation
      if (!book_id || !student_name || !student_id_number || !borrowed_date || !due_date) {
        return res.status(400).json({
          success: false,
          message: 'Book ID, student name, student ID number, borrow date, and due date are required'
        });
      }

      // Validate dates
      const borrowDate = new Date(borrowed_date);
      const dueDate = new Date(due_date);
      
      if (dueDate <= borrowDate) {
        return res.status(400).json({
          success: false,
          message: 'Due date must be after borrow date'
        });
      }

      const userId = req.body.userId || null;

      const transactionId = await Transaction.create({
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
      }, userId);

      // Fetch the created transaction
      const newTransaction = await Transaction.getById(transactionId);

      res.status(201).json({
        success: true,
        message: 'Book borrowed successfully',
        data: newTransaction
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      
      if (error.message === 'Book is not available for borrowing') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create transaction'
      });
    }
  }

  // Return book
  static async returnBook(req, res) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || null;

      await Transaction.returnBook(id, userId);

      res.json({
        success: true,
        message: 'Book returned successfully'
      });
    } catch (error) {
      console.error('Return book error:', error);

      if (error.message === 'Transaction not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'Book already returned') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to return book'
      });
    }
  }

  // Extend due date
  static async extendDueDate(req, res) {
    try {
      const { id } = req.params;
      const { days } = req.body;
      const userId = req.body.userId || null;

      if (!days || days <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of days must be greater than 0'
        });
      }

      // Get current transaction
      const transaction = await Transaction.getById(id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Calculate new due date
      const currentDueDate = new Date(transaction.due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + parseInt(days));

      await Transaction.extendDueDate(id, newDueDate.toISOString().split('T')[0], userId);

      res.json({
        success: true,
        message: `Due date extended by ${days} days`
      });
    } catch (error) {
      console.error('Extend due date error:', error);

      if (error.message === 'Cannot extend due date for returned book') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to extend due date'
      });
    }
  }

  // Update overdue status
  static async updateOverdueStatus(req, res) {
    try {
      const count = await Transaction.updateOverdueStatus();

      res.json({
        success: true,
        message: `Updated ${count} transactions to overdue`,
        count: count
      });
    } catch (error) {
      console.error('Update overdue status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update overdue status'
      });
    }
  }

  // Get statistics
  static async getStats(req, res) {
    try {
      const stats = await Transaction.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }

  // Search transactions
  static async searchTransactions(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const transactions = await Transaction.search(q);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Search transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search transactions'
      });
    }
  }

  // Get available books for borrowing
  static async getAvailableBooks(req, res) {
    try {
      const books = await Book.getAll();
      
      // Filter only available books
      const availableBooks = books.filter(book => book.available_quantity > 0);

      res.json({
        success: true,
        data: availableBooks,
        count: availableBooks.length
      });
    } catch (error) {
      console.error('Get available books error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available books'
      });
    }
  }

  // Get unique borrowers (for reports/analytics)
  static async getUniqueBorrowers(req, res) {
    try {
      const borrowers = await Transaction.getUniqueBorrowers();

      res.json({
        success: true,
        data: borrowers,
        count: borrowers.length
      });
    } catch (error) {
      console.error('Get unique borrowers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch borrowers'
      });
    }
  }
}

module.exports = TransactionController;