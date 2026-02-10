const Book = require('../models/book');

class BookController {
  // Get all books
  static async getAllBooks(req, res) {
    try {
      const books = await Book.getAll();
      
      res.json({
        success: true,
        data: books,
        count: books.length
      });
    } catch (error) {
      console.error('Get all books error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch books'
      });
    }
  }

  // Get single book by ID
  static async getBook(req, res) {
    try {
      const { id } = req.params;
      const book = await Book.getById(id);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        data: book
      });
    } catch (error) {
      console.error('Get book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book'
      });
    }
  }

  // Search books
  static async searchBooks(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const books = await Book.search(q);

      res.json({
        success: true,
        data: books,
        count: books.length
      });
    } catch (error) {
      console.error('Search books error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search books'
      });
    }
  }

  // Create new book - IMPROVED
  static async createBook(req, res) {
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
      } = req.body;

      // Validation
      if (!title || !author || !isbn) {
        return res.status(400).json({
          success: false,
          message: 'Title, author, and ISBN are required'
        });
      }

      // Check if ISBN already exists
      const isbnExists = await Book.isbnExists(isbn);
      if (isbnExists) {
        return res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists'
        });
      }

      // Get user ID from request
      const userId = req.body.userId || null;

      // Create the book
      const bookId = await Book.create({
        title,
        author,
        isbn,
        quantity: parseInt(quantity) || 1,
        cover_image,
        category,
        publisher,
        published_year,
        description,
        location
      }, userId);

      console.log('✅ Book created successfully with ID:', bookId);

      // Try to fetch the created book, but don't fail if it doesn't work
      try {
        const newBook = await Book.getById(bookId);
        
        if (newBook) {
          // Successfully fetched the book
          return res.status(201).json({
            success: true,
            message: 'Book created successfully',
            data: newBook
          });
        } else {
          // Book created but couldn't be fetched (timing issue)
          console.warn('⚠️ Book created but getById returned null. Returning ID only.');
          return res.status(201).json({
            success: true,
            message: 'Book created successfully',
            data: { book_id: bookId }
          });
        }
      } catch (fetchError) {
        // Book was created but fetching failed
        console.warn('⚠️ Book created but fetch failed:', fetchError.message);
        return res.status(201).json({
          success: true,
          message: 'Book created successfully',
          data: { book_id: bookId }
        });
      }
    } catch (error) {
      console.error('❌ Create book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create book',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update book
  static async updateBook(req, res) {
    try {
      const { id } = req.params;
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
      } = req.body;

      // Validation
      if (!title || !author || !isbn) {
        return res.status(400).json({
          success: false,
          message: 'Title, author, and ISBN are required'
        });
      }

      // Check if book exists
      const existingBook = await Book.getById(id);
      if (!existingBook) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Check if ISBN is being changed and if new ISBN already exists
      if (isbn !== existingBook.isbn) {
        const isbnExists = await Book.isbnExists(isbn, id);
        if (isbnExists) {
          return res.status(409).json({
            success: false,
            message: 'A book with this ISBN already exists'
          });
        }
      }

      // Get user ID
      const userId = req.body.userId || null;

      await Book.update(id, {
        title,
        author,
        isbn,
        quantity: parseInt(quantity) || 1,
        cover_image,
        category,
        publisher,
        published_year,
        description,
        location
      }, userId);

      // Fetch updated book
      const updatedBook = await Book.getById(id);

      res.json({
        success: true,
        message: 'Book updated successfully',
        data: updatedBook
      });
    } catch (error) {
      console.error('Update book error:', error);
      
      if (error.message === 'Book not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update book'
      });
    }
  }

  // Delete book
  static async deleteBook(req, res) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || null;

      await Book.delete(id, userId);

      res.json({
        success: true,
        message: 'Book deleted successfully'
      });
    } catch (error) {
      console.error('Delete book error:', error);

      if (error.message === 'Book not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'Cannot delete book with active borrowings') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete book'
      });
    }
  }

  // Get book statistics
  static async getStats(req, res) {
    try {
      const stats = await Book.getStats();

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
}

module.exports = BookController;