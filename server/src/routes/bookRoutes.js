const express        = require('express');
const router         = express.Router();
const BookController = require('../controllers/bookController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware');

// Note: Removed validateCreateBook and validateUpdateBook middleware
// Image validation now handled in controller with proper base64 support
// validateBookId, validateISBN, validateBookSearch still applied where safe

router.get('/',              optionalAuth,                              BookController.getAllBooks);
router.get('/search',        optionalAuth,                             BookController.searchBooks);
router.get('/stats',         authenticate,                             BookController.getStats);
router.get('/isbn/:isbn',    optionalAuth,                             BookController.getBookByISBN);
router.get('/:id',           optionalAuth,                             BookController.getBook);
router.post('/',             authenticate,  requireAdmin,              BookController.createBook);
router.put('/:id',           authenticate,  requireAdmin,              BookController.updateBook);
router.delete('/:id',        authenticate,  requireAdmin,              BookController.deleteBook);

module.exports = router;