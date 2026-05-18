import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  pauseResumeRecurringPayment,
  markAsPaid,
  skipOccurrence,
  deleteRecurringPayment,
  getDueSoon,
} from '../controllers/recurringPayment.controller.js'

const router = Router()

// All recurring payment routes require authentication
router.use(authenticate)

// GET    /api/recurring-payments              → list user's recurring payments
// POST   /api/recurring-payments              → create recurring payment
// PUT    /api/recurring-payments/:id          → update recurring payment
// PUT    /api/recurring-payments/:id/pause    → pause/resume
// POST   /api/recurring-payments/:id/pay      → mark as paid (create transaction)
// POST   /api/recurring-payments/:id/skip     → skip next occurrence
// DELETE /api/recurring-payments/:id          → delete recurring payment
// GET    /api/recurring-payments/due-soon     → get payments due soon

router.get('/',              getRecurringPayments)
router.get('/due-soon',     getDueSoon)
router.post('/',             createRecurringPayment)
router.put('/:id/pause',    pauseResumeRecurringPayment)
router.post('/:id/pay',     markAsPaid)
router.post('/:id/skip',    skipOccurrence)
router.put('/:id',          updateRecurringPayment)
router.delete('/:id',       deleteRecurringPayment)

export default router
