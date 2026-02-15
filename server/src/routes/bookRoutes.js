const express = require('express');
const router = express.Router();
const BookController = require('../controllers/bookController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware');

router.get('/', optionalAuth, BookController.getAllBooks);
router.get('/search', optionalAuth, BookController.searchBooks);
router.get('/isbn/:isbn', optionalAuth, BookController.getBookByISBN); // ISBN lookup route - must be before /:id
router.get('/stats', authenticate, BookController.getStats);
router.get('/:id', optionalAuth, BookController.getBook);
router.post('/', authenticate, requireAdmin, BookController.createBook);
router.put('/:id', authenticate, requireAdmin, BookController.updateBook);
router.delete('/:id', authenticate, requireAdmin, BookController.deleteBook);

module.exports = router;