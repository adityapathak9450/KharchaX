import { Router } from 'express';
import {
  getWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
  transferFunds,
  getWalletBalance,
  getWalletTransactions,
} from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createWalletSchema,
  updateWalletSchema,
  transferFundsSchema,
  validateBody,
} from '../validators/wallet.validator.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/wallets - Get all wallets for the user
router.get('/', getWallets);

// POST /api/wallets - Create new wallet
router.post('/', validateBody(createWalletSchema), createWallet);

// GET /api/wallets/transfer - Transfer funds between wallets
// IMPORTANT: This route must be BEFORE /:id
router.post('/transfer', validateBody(transferFundsSchema), transferFunds);

// GET /api/wallets/:id/balance - Get wallet balance
// IMPORTANT: This route must be BEFORE /:id
router.get('/:id/balance', getWalletBalance);

// GET /api/wallets/:id/transactions - Get wallet transactions
// IMPORTANT: This route must be BEFORE /:id
router.get('/:id/transactions', getWalletTransactions);

// GET /api/wallets/:id - Get single wallet
router.get('/:id', getWallet);

// PUT /api/wallets/:id - Update wallet
router.put('/:id', validateBody(updateWalletSchema), updateWallet);

// DELETE /api/wallets/:id - Delete wallet
router.delete('/:id', deleteWallet);

export default router;
