const express               = require('express');
const router                = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authenticate }      = require('../middleware');
const {
  validateTransactionId,
  validateCreateTransaction,
  validateExtendDueDate,
  validateSearchQuery,
} = require('../middleware/validation.middleware');

router.get('/',                          authenticate, TransactionController.getAllTransactions);
router.get('/stats',                     authenticate, TransactionController.getStats);
router.get('/search',                    authenticate, validateSearchQuery,      TransactionController.searchTransactions);
router.get('/helpers/available-books',   authenticate, TransactionController.getAvailableBooks);
router.get('/helpers/borrowers',         authenticate, TransactionController.getUniqueBorrowers);
router.get('/:id',                       authenticate, validateTransactionId,    TransactionController.getTransaction);
router.post('/',                         authenticate, validateCreateTransaction, TransactionController.createTransaction);
router.post('/update-overdue',           authenticate, TransactionController.updateOverdueStatus);
router.put('/:id/return',                authenticate, validateTransactionId,    TransactionController.returnBook);
router.put('/:id/undo-return',           authenticate, validateTransactionId,    TransactionController.undoReturn);
router.put('/:id/extend',                authenticate, validateExtendDueDate,    TransactionController.extendDueDate);

module.exports = router;