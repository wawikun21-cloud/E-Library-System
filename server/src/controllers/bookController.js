const Book = require('../models/book');
const axios = require('axios');

class BookController {
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: SANITIZE THUMBNAIL URL
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Sanitize and normalize thumbnail URLs
   * 
   * @param {string | undefined | null} thumbnail - Raw thumbnail URL or base64
   * @returns {string | null} - Sanitized URL or null
   * 
   * Behavior:
   * - undefined/null/empty → return null
   * - http:// URLs → convert to https://
   * - https:// URLs → allow as-is
   * - data:image/ base64 → allow as-is
   * - Invalid formats → return null (don't block, just log warning)
   */
  static sanitizeThumbnail(thumbnail) {
    // Handle empty values
    if (!thumbnail || thumbnail.trim() === '') {
      return null;
    }

    const trimmed = thumbnail.trim();

    // Allow base64 images
    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }

    // Convert HTTP to HTTPS (Google Books, Open Library often use HTTP)
    if (trimmed.startsWith('http://')) {
      const httpsUrl = trimmed.replace('http://', 'https://');
      console.log(`📸 Auto-converted HTTP to HTTPS: ${trimmed.substring(0, 50)}...`);
      return httpsUrl;
    }

    // Allow HTTPS URLs as-is
    if (trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Invalid format - log warning but don't block book creation
    console.warn(`⚠️ Invalid thumbnail format (ignored): ${trimmed.substring(0, 50)}...`);
    return null;
  }

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

  // Get book information by ISBN from Google Books API
  static async getBookByISBN(req, res) {
    try {
      const { isbn } = req.params;

      if (!isbn || isbn.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ISBN is required'
        });
      }

      console.log('Fetching book info for ISBN:', isbn);

      // Build URL with optional API key
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const googleBooksUrl = apiKey 
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      
      console.log('Using Google Books API:', apiKey ? 'with API key' : 'without API key');

      // Call Google Books API
      const response = await axios.get(googleBooksUrl, {
        timeout: 8000 // 8 second timeout
      });

      if (!response.data.items || response.data.items.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Book not found for this ISBN'
        });
      }

      // Extract book information from the first result
      const bookInfo = response.data.items[0].volumeInfo;
      
      // Format the data to match our expected structure
      const formattedData = {
        title: bookInfo.title || '',
        authors: bookInfo.authors ? bookInfo.authors.join(', ') : '',
        publisher: bookInfo.publisher || '',
        publishedDate: bookInfo.publishedDate || '',
        description: bookInfo.description || '',
        thumbnail: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || '',
        categories: bookInfo.categories ? bookInfo.categories.join(', ') : '',
        pageCount: bookInfo.pageCount || null,
        language: bookInfo.language || '',
      };

      console.log('Book info fetched successfully:', formattedData.title);

      res.json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      console.error('Get book by ISBN error:', error.message);
      
      // Handle rate limiting (429 error)
      if (error.response && error.response.status === 429) {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Please try again later or add a Google Books API key.'
        });
      }
      
      // Handle timeout
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          success: false,
          message: 'Request timeout. Please try again.'
        });
      }
      
      if (error.response) {
        // Google Books API returned an error
        return res.status(error.response.status || 500).json({
          success: false,
          message: 'Failed to fetch book information from Google Books'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch book information'
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

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADED: SAFE IMAGE VALIDATION (No longer blocking)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Validate cover image (base64 or URL) - SECURITY CHECK
   * 
   * UPDATED: Now accepts both HTTP and HTTPS URLs
   * Invalid images are converted to null instead of blocking creation
   */
  static validateCoverImage(cover_image) {
    if (!cover_image) return { valid: true, sanitized: null }; // Optional field

    // Accept base64 images (from frontend compression)
    if (cover_image.startsWith('data:image/')) {
      // Validate image type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const typeMatch = cover_image.match(/^data:(image\/[a-z]+);base64,/);
      
      if (!typeMatch || !validTypes.includes(typeMatch[1])) {
        console.warn('⚠️ Invalid base64 image type, setting to null');
        return { valid: true, sanitized: null }; // Don't block, just nullify
      }

      // Check base64 size (rough calculation)
      const base64Size = cover_image.length;
      const actualSizeMB = (base64Size * 0.75) / (1024 * 1024); // Convert to MB

      if (actualSizeMB > 1.8) { // 1.8MB limit (accounting for base64 overhead)
        console.warn(`⚠️ Image too large (${actualSizeMB.toFixed(2)}MB), setting to null`);
        return { valid: true, sanitized: null }; // Don't block, just nullify
      }

      return { valid: true, sanitized: cover_image };
    }

    // Accept HTTP URLs (auto-convert to HTTPS)
    if (cover_image.startsWith('http://')) {
      const httpsUrl = cover_image.replace('http://', 'https://');
      try {
        new URL(httpsUrl); // Validate URL format
        console.log('📸 Auto-converted HTTP to HTTPS');
        return { valid: true, sanitized: httpsUrl };
      } catch (err) {
        console.warn('⚠️ Invalid HTTP URL format, setting to null');
        return { valid: true, sanitized: null }; // Don't block, just nullify
      }
    }

    // Accept HTTPS URLs (from external sources like Google Books API)
    if (cover_image.startsWith('https://')) {
      try {
        new URL(cover_image); // Validate URL format
        return { valid: true, sanitized: cover_image };
      } catch (err) {
        console.warn('⚠️ Invalid HTTPS URL format, setting to null');
        return { valid: true, sanitized: null }; // Don't block, just nullify
      }
    }

    // Invalid format - don't block, just set to null
    console.warn('⚠️ Unrecognized image format, setting to null');
    return { valid: true, sanitized: null };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADED: CREATE BOOK (with safe image handling)
  // ═══════════════════════════════════════════════════════════════════════════
  
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

      // ═══════════════════════════════════════════════════════════════════════
      // SECURITY: Validate and sanitize cover image
      // ═══════════════════════════════════════════════════════════════════════
      const imageValidation = BookController.validateCoverImage(cover_image);
      
      // Use sanitized version (HTTP→HTTPS, invalid→null)
      const sanitizedCoverImage = imageValidation.sanitized;
      
      if (sanitizedCoverImage !== cover_image) {
        console.log('📸 Image sanitized:', {
          original: cover_image?.substring(0, 50),
          sanitized: sanitizedCoverImage?.substring(0, 50) || 'null'
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

      // Get user ID from authenticated user (set by authenticate middleware)
      const userId = req.user?.userId || null;

      // Create the book with sanitized image
      const bookId = await Book.create({
        title,
        author,
        isbn,
        quantity: parseInt(quantity) || 1,
        cover_image: sanitizedCoverImage, // Use sanitized version
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
      
      // Handle duplicate ISBN error specifically
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create book',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPGRADED: UPDATE BOOK (with safe image handling)
  // ═══════════════════════════════════════════════════════════════════════════
  
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

      // ═══════════════════════════════════════════════════════════════════════
      // SECURITY: Validate and sanitize cover image
      // ═══════════════════════════════════════════════════════════════════════
      const imageValidation = BookController.validateCoverImage(cover_image);
      const sanitizedCoverImage = imageValidation.sanitized;

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

      // Get user ID from authenticated user (set by authenticate middleware)
      const userId = req.user?.userId || null;

      await Book.update(id, {
        title,
        author,
        isbn,
        quantity: parseInt(quantity) || 1,
        cover_image: sanitizedCoverImage, // Use sanitized version
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
      // Get user ID from authenticated user (set by authenticate middleware).
      // Do NOT use req.body here — DELETE requests have no body, so express.json()
      // may leave req.body undefined, causing "Cannot read properties of undefined".
      const userId = req.user?.userId || null;

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