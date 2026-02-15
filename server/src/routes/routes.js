/**
 * Updated Route Files with Middleware Protection
 * Copy these to replace your existing route files
 */

// ============================================
// FILE: authRoutes.js (UPDATED)
// ============================================
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware');

// Public routes (no authentication required)
router.post('/login', AuthController.login);

// Protected routes (authentication required)
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/verify', authenticate, AuthController.verifySession);
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/password', authenticate, AuthController.updatePassword);
router.post('/refresh', authenticate, AuthController.refreshToken);

module.exports = router;


// ============================================
// FILE: bookRoutes.js (UPDATED)
// ============================================
const express = require('express');
const router = express.Router();
const BookController = require('../controllers/bookController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware');

// Public routes (anyone can view books)
router.get('/', optionalAuth, BookController.getAllBooks);
router.get('/search', optionalAuth, BookController.searchBooks);
router.get('/:id', optionalAuth, BookController.getBook);

// Protected routes (authentication required)
router.get('/stats', authenticate, BookController.getStats);

// Admin-only routes (create, update, delete books)
router.post('/', authenticate, requireAdmin, BookController.createBook);
router.put('/:id', authenticate, requireAdmin, BookController.updateBook);
router.delete('/:id', authenticate, requireAdmin, BookController.deleteBook);

module.exports = router;


// ============================================
// FILE: transactionRoutes.js (UPDATED)
// ============================================
const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authenticate, requireAdmin, requireLibrarian } = require('../middleware');

// All transaction routes require authentication
router.use(authenticate);

// General transaction routes (authenticated users)
router.get('/', TransactionController.getAllTransactions);
router.get('/stats', TransactionController.getStats);
router.get('/search', TransactionController.searchTransactions);
router.get('/:id', TransactionController.getTransaction);

// Admin/Librarian only routes (create and manage transactions)
router.post('/', requireLibrarian, TransactionController.createTransaction);
router.put('/:id/return', requireLibrarian, TransactionController.returnBook);
router.put('/:id/undo-return', requireAdmin, TransactionController.undoReturn);
router.put('/:id/extend', requireLibrarian, TransactionController.extendDueDate);
router.post('/update-overdue', requireLibrarian, TransactionController.updateOverdueStatus);

// Helper routes
router.get('/helpers/available-books', TransactionController.getAvailableBooks);
router.get('/unique-borrowers', requireAdmin, TransactionController.getUniqueBorrowers);

module.exports = router;


// ============================================
// NOTES ON ROUTE PROTECTION
// ============================================

/**
 * MIDDLEWARE USAGE PATTERNS:
 * 
 * 1. PUBLIC ROUTES (no middleware needed)
 *    - Login, registration
 *    - Public book browsing (optional)
 * 
 * 2. AUTHENTICATED ROUTES (authenticate only)
 *    router.get('/profile', authenticate, controller);
 * 
 * 3. ADMIN-ONLY ROUTES
 *    router.delete('/books/:id', authenticate, requireAdmin, controller);
 * 
 * 4. MULTIPLE ROLES
 *    router.post('/transactions', authenticate, requireLibrarian, controller);
 *    // requireLibrarian allows both 'admin' and 'librarian' roles
 * 
 * 5. APPLY TO ALL ROUTES IN FILE
 *    router.use(authenticate); // All routes below require auth
 * 
 * 6. OPTIONAL AUTHENTICATION
 *    router.get('/books', optionalAuth, controller);
 *    // Works with or without token, req.user will be null if no token
 */