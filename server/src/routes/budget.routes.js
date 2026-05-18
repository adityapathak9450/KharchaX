import { Router } from 'express';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
  updateBudgetSpent,
} from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  validateBody,
} from '../validators/budget.validator.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/budgets - Get all budgets for the user
router.get('/', getBudgets);

// GET /api/budgets/summary - Get budget summary for current month
// IMPORTANT: This route must be BEFORE /:id
router.get('/summary', getBudgetSummary);

// POST /api/budgets - Create new budget
router.post('/', validateBody(createBudgetSchema), createBudget);

// GET /api/budgets/:id - Get single budget
router.get('/:id', getBudget);

// PUT /api/budgets/:id - Update budget
router.put('/:id', validateBody(updateBudgetSchema), updateBudget);

// PUT /api/budgets/:id/spent - Update budget spent amount (internal use)
// IMPORTANT: This route must be BEFORE /:id
router.put('/:id/spent', updateBudgetSpent);

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', deleteBudget);

export default router;
