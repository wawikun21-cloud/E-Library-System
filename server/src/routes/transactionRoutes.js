const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authenticate, requireAdmin, requireLibrarian } = require('../middleware');

router.use(authenticate); // All routes require auth

router.get('/', TransactionController.getAllTransactions);
router.get('/stats', TransactionController.getStats);
router.get('/search', TransactionController.searchTransactions);
router.get('/:id', TransactionController.getTransaction);
router.post('/', requireLibrarian, TransactionController.createTransaction);
router.put('/:id/return', requireLibrarian, TransactionController.returnBook);
router.put('/:id/undo-return', requireAdmin, TransactionController.undoReturn);
router.put('/:id/extend', requireLibrarian, TransactionController.extendDueDate);
router.post('/update-overdue', requireLibrarian, TransactionController.updateOverdueStatus);
router.get('/helpers/available-books', TransactionController.getAvailableBooks);
router.get('/unique-borrowers', requireAdmin, TransactionController.getUniqueBorrowers);

module.exports = router;