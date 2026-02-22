const Book = require('../models/book');
const axios = require('axios');

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

  // Get book information by ISBN from Google Books API + Open Library API
  static async getBookByISBN(req, res) {
    try {
      const { isbn } = req.params;

      if (!isbn || isbn.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ISBN is required'
        });
      }

      console.log('📚 Fetching book info for ISBN:', isbn);

      // Try both APIs in parallel for faster results
      const [googleResult, openLibResult] = await Promise.allSettled([
        BookController.fetchFromGoogleBooks(isbn),
        BookController.fetchFromOpenLibrary(isbn)
      ]);

      // Merge data from both sources (prioritize best data)
      const mergedData = BookController.mergeBookData(
        googleResult.status === 'fulfilled' ? googleResult.value : null,
        openLibResult.status === 'fulfilled' ? openLibResult.value : null
      );

      if (!mergedData) {
        return res.status(404).json({
          success: false,
          message: 'Book not found in Google Books or Open Library',
          sources_checked: ['Google Books', 'Open Library']
        });
      }

      console.log('✅ Book info fetched successfully:', mergedData.title);
      console.log('📊 Data sources:', mergedData._sources);

      res.json({
        success: true,
        data: mergedData
      });
    } catch (error) {
      console.error('❌ Get book by ISBN error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book information'
      });
    }
  }

  // Fetch from Google Books API
  static async fetchFromGoogleBooks(isbn) {
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const googleBooksUrl = apiKey 
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      
      console.log('🔍 Searching Google Books...');

      const response = await axios.get(googleBooksUrl, {
        timeout: 8000
      });

      if (!response.data.items || response.data.items.length === 0) {
        console.log('⚠️ Google Books: No results');
        return null;
      }

      const bookInfo = response.data.items[0].volumeInfo;
      
      console.log('✅ Google Books: Found -', bookInfo.title);
      
      return {
        title: bookInfo.title || '',
        authors: bookInfo.authors ? bookInfo.authors.join(', ') : '',
        publisher: bookInfo.publisher || '',
        publishedDate: bookInfo.publishedDate || '',
        description: bookInfo.description || '',
        thumbnail: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || '',
        categories: bookInfo.categories ? bookInfo.categories.join(', ') : '',
        pageCount: bookInfo.pageCount || null,
        language: bookInfo.language || '',
        _source: 'Google Books'
      };
    } catch (error) {
      console.log('⚠️ Google Books error:', error.message);
      
      // Handle rate limiting
      if (error.response && error.response.status === 429) {
        console.log('⚠️ Google Books rate limit exceeded');
      }
      
      return null;
    }
  }

  // Fetch from Open Library API
  static async fetchFromOpenLibrary(isbn) {
    try {
      // Open Library ISBN API
      const openLibUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
      
      console.log('🔍 Searching Open Library...');

      const response = await axios.get(openLibUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Lexora-Library/1.0 (Educational Project)'
        }
      });

      const bookKey = `ISBN:${isbn}`;
      const bookData = response.data[bookKey];

      if (!bookData) {
        console.log('⚠️ Open Library: No results');
        return null;
      }

      console.log('✅ Open Library: Found -', bookData.title);

      // Extract authors
      const authors = bookData.authors 
        ? bookData.authors.map(a => a.name).join(', ') 
        : '';

      // Extract publishers
      const publisher = bookData.publishers 
        ? bookData.publishers.map(p => p.name).join(', ')
        : '';

      // Extract subjects/categories
      const categories = bookData.subjects 
        ? bookData.subjects.slice(0, 3).map(s => s.name).join(', ')
        : '';

      // Get best thumbnail (prefer large, fallback to medium/small)
      let thumbnail = '';
      if (bookData.cover) {
        thumbnail = bookData.cover.large || bookData.cover.medium || bookData.cover.small || '';
      }

      return {
        title: bookData.title || '',
        authors: authors,
        publisher: publisher,
        publishedDate: bookData.publish_date || '',
        description: bookData.notes || bookData.subtitle || '',
        thumbnail: thumbnail,
        categories: categories,
        pageCount: bookData.number_of_pages || null,
        language: '', // Open Library doesn't always provide this
        _source: 'Open Library'
      };
    } catch (error) {
      console.log('⚠️ Open Library error:', error.message);
      return null;
    }
  }

  // Merge data from both sources (intelligent selection)
  static mergeBookData(googleData, openLibData) {
    // If both failed, return null
    if (!googleData && !openLibData) {
      return null;
    }

    // If only one source has data, use it
    if (!googleData) return { ...openLibData, _sources: ['Open Library'] };
    if (!openLibData) return { ...googleData, _sources: ['Google Books'] };

    // Both sources have data - merge intelligently
    console.log('🔄 Merging data from both sources...');

    const merged = {
      // Title: Prefer Google Books (usually more accurate)
      title: googleData.title || openLibData.title,
      
      // Authors: Prefer Google Books
      authors: googleData.authors || openLibData.authors,
      
      // Publisher: Prefer Google Books
      publisher: googleData.publisher || openLibData.publisher,
      
      // Published Date: Prefer Google Books (more consistent format)
      publishedDate: googleData.publishedDate || openLibData.publishedDate,
      
      // Description: Prefer longer/more detailed description
      description: (googleData.description && googleData.description.length > 100)
        ? googleData.description
        : (openLibData.description || googleData.description || ''),
      
      // Thumbnail: Prefer Open Library (usually higher quality)
      // Fallback to Google Books if Open Library has none
      thumbnail: openLibData.thumbnail || googleData.thumbnail || '',
      
      // Categories: Combine both sources for richer data
      categories: [googleData.categories, openLibData.categories]
        .filter(Boolean)
        .join(', ') || '',
      
      // Page Count: Prefer whichever has data
      pageCount: googleData.pageCount || openLibData.pageCount || null,
      
      // Language: Google Books only (Open Library often missing)
      language: googleData.language || '',
      
      // Track which sources were used
      _sources: ['Google Books', 'Open Library']
    };

    return merged;
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

  // Validate cover image (base64 or URL) - SECURITY CHECK
  static validateCoverImage(cover_image) {
    if (!cover_image) return { valid: true }; // Optional field

    // Accept base64 images (from frontend compression)
    if (cover_image.startsWith('data:image/')) {
      // Validate image type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const typeMatch = cover_image.match(/^data:(image\/[a-z]+);base64,/);
      
      if (!typeMatch || !validTypes.includes(typeMatch[1])) {
        return { 
          valid: false, 
          message: 'Invalid image type. Only JPEG, PNG, WEBP, and GIF are allowed.' 
        };
      }

      // Check base64 size (rough calculation)
      const base64Size = cover_image.length;
      const actualSizeMB = (base64Size * 0.75) / (1024 * 1024); // Convert to MB

      if (actualSizeMB > 1.8) { // 1.8MB limit (accounting for base64 overhead)
        return { 
          valid: false, 
          message: `Image size (${actualSizeMB.toFixed(2)}MB) exceeds 1.8MB limit. Please compress the image.` 
        };
      }

      return { valid: true };
    }

    // Accept HTTPS URLs (from external sources)
    if (cover_image.startsWith('https://')) {
      try {
        new URL(cover_image); // Validate URL format
        return { valid: true };
      } catch (err) {
        return { valid: false, message: 'Invalid image URL format.' };
      }
    }

    // Reject anything else (security)
    return { 
      valid: false, 
      message: 'Cover image must be a base64 data URI or HTTPS URL.' 
    };
  }

  // Create new book - WITH IMAGE VALIDATION
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

      // SECURITY: Validate cover image (base64 or URL)
      const imageValidation = BookController.validateCoverImage(cover_image);
      if (!imageValidation.valid) {
        return res.status(400).json({
          success: false,
          message: imageValidation.message
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

  // Update book - WITH IMAGE VALIDATION
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

      // SECURITY: Validate cover image (base64 or URL)
      const imageValidation = BookController.validateCoverImage(cover_image);
      if (!imageValidation.valid) {
        return res.status(400).json({
          success: false,
          message: imageValidation.message
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

      // Get user ID from authenticated user (set by authenticate middleware)
      const userId = req.user?.userId || null;

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