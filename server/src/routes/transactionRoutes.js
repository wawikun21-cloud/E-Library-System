const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');

// Transaction routes
router.get('/', TransactionController.getAllTransactions);
router.get('/stats', TransactionController.getStats);
router.get('/search', TransactionController.searchTransactions);
router.get('/unique-borrowers', TransactionController.getUniqueBorrowers);
router.get('/:id', TransactionController.getTransaction);
router.post('/', TransactionController.createTransaction);
router.put('/:id/return', TransactionController.returnBook);
router.put('/:id/undo-return', TransactionController.undoReturn);
router.put('/:id/extend', TransactionController.extendDueDate);
router.post('/update-overdue', TransactionController.updateOverdueStatus);

// Helper routes
router.get('/helpers/available-books', TransactionController.getAvailableBooks);

module.exports = router;