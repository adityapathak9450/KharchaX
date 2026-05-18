import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  getSharedWallets,
  createSharedWallet,
  joinSharedWallet,
  addMemberToSharedWallet,
  removeMemberFromSharedWallet,
  getSharedWalletTransactions,
  getSharedWalletSettlements,
} from '../controllers/sharedWallet.controller.js'

const router = Router()

// All shared wallet routes require authentication
router.use(authenticate)

// GET    /api/shared-wallets              → list user's shared wallets
// POST   /api/shared-wallets              → create shared wallet
// POST   /api/shared-wallets/join         → join via invite code
// POST   /api/shared-wallets/:id/members  → add member
// DELETE /api/shared-wallets/:id/members/:memberId → remove member
// GET    /api/shared-wallets/:id/transactions → get transactions
// GET    /api/shared-wallets/:id/settlements → get settlements

router.get('/',              getSharedWallets)
router.post('/',             createSharedWallet)
router.post('/join',        joinSharedWallet)
router.post('/:id/members',  addMemberToSharedWallet)
router.delete('/:id/members/:memberId', removeMemberFromSharedWallet)
router.get('/:id/transactions', getSharedWalletTransactions)
router.get('/:id/settlements', getSharedWalletSettlements)

export default router
