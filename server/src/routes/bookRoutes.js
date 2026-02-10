const express = require('express');
const router = express.Router();
const BookController = require('../controllers/bookController');

// GET /api/books - Get all books
router.get('/', BookController.getAllBooks);

// GET /api/books/stats - Get book statistics
router.get('/stats', BookController.getStats);

// GET /api/books/search?q=query - Search books
router.get('/search', BookController.searchBooks);

// GET /api/books/:id - Get single book
router.get('/:id', BookController.getBook);

// POST /api/books - Create new book
router.post('/', BookController.createBook);

// PUT /api/books/:id - Update book
router.put('/:id', BookController.updateBook);

// DELETE /api/books/:id - Delete book
router.delete('/:id', BookController.deleteBook);

module.exports = router;