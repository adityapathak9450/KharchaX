import { Router } from 'express'
import authRoutes from './auth.routes.js'
import walletRoutes from './wallet.routes.js'
import transactionRoutes from './transaction.routes.js'
import budgetRoutes from './budget.routes.js'
import analyticsRoutes from './analytics.routes.js'
import categoryRoutes from './category.routes.js'
import reportRoutes from './report.routes.js'
import uploadRoutes from './upload.routes.js'
import notificationRoutes from './notification.routes.js'
import sharedWalletRoutes from './sharedWallet.routes.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OK',
    data: { ok: true, service: 'vaultx-api' },
  })
})

router.use('/auth', authRoutes)
router.use('/wallets', walletRoutes)
router.use('/transactions', transactionRoutes)
router.use('/budgets', budgetRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/categories', categoryRoutes)
router.use('/reports', reportRoutes)
router.use('/upload', uploadRoutes)
router.use('/notifications', notificationRoutes)
router.use('/shared-wallets', sharedWalletRoutes)

export default router
