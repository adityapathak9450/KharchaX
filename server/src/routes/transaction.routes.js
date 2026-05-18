import { Router } from 'express';
import multer from 'multer';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDelete,
  exportCSV,
  importCSV,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Configure multer for CSV import
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/transactions - Get all transactions with filters and pagination
router.get('/', getTransactions);

// POST /api/transactions - Create new transaction
router.post('/', createTransaction);

// GET /api/transactions/export - Export transactions as CSV
// IMPORTANT: This route must be BEFORE /:id
router.get('/export', exportCSV);

// POST /api/transactions/import - Import transactions from CSV
// IMPORTANT: This route must be BEFORE /:id
router.post('/import', upload.single('file'), importCSV);

// DELETE /api/transactions/bulk - Bulk delete transactions
// IMPORTANT: This route must be BEFORE /:id
router.delete('/bulk', bulkDelete);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

export default router;
