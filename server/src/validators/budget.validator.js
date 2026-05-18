import { z } from 'zod'

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(120, 'Budget name is too long'),
  amount: z.number().min(0.01, 'Budget amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  month: z.number().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.number().min(1970, 'Invalid year').max(2100, 'Invalid year'),
  alertAt: z.number().min(1, 'Alert threshold must be at least 1%').max(100, 'Alert threshold cannot exceed 100%').default(80),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid color format').optional()
})

export const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(120, 'Budget name is too long').optional(),
  amount: z.number().min(0.01, 'Budget amount must be greater than zero').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  month: z.number().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12').optional(),
  year: z.number().min(1970, 'Invalid year').max(2100, 'Invalid year').optional(),
  alertAt: z.number().min(1, 'Alert threshold must be at least 1%').max(100, 'Alert threshold cannot exceed 100%').optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid color format').optional()
})

export function validateBody(schema) {
  return function validateBodyMiddleware(req, res, next) {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      })
    }
    req.body = parsed.data
    return next()
  }
}
