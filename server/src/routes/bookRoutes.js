const express        = require('express');
const router         = express.Router();
const BookController = require('../controllers/bookController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware');
const {
  validateBookId,
  validateISBN,
  validateBookSearch,
  validateCreateBook,
  validateUpdateBook,
} = require('../middleware/validation.middleware');

router.get('/',              optionalAuth,                              BookController.getAllBooks);
router.get('/search',        optionalAuth,  validateBookSearch,         BookController.searchBooks);
router.get('/stats',         authenticate,                             BookController.getStats);
router.get('/isbn/:isbn',    optionalAuth,  validateISBN,               BookController.getBookByISBN);
router.get('/:id',           optionalAuth,  validateBookId,             BookController.getBook);
router.post('/',             authenticate,  requireAdmin, validateCreateBook, BookController.createBook);
router.put('/:id',           authenticate,  requireAdmin, validateUpdateBook, BookController.updateBook);
router.delete('/:id',        authenticate,  requireAdmin, validateBookId,     BookController.deleteBook);

module.exports = router;