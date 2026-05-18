import { z } from 'zod'

export const createWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(120, 'Wallet name is too long'),
  type: z.enum(['bank', 'cash', 'upi', 'business', 'shared'], {
    errorMap: () => ({ message: 'Invalid wallet type' })
  }),
  balance: z.number().min(0, 'Balance cannot be negative').default(0),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid color format').optional(),
  icon: z.string().max(64, 'Icon name is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional()
})

export const updateWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(120, 'Wallet name is too long').optional(),
  type: z.enum(['bank', 'cash', 'upi', 'business', 'shared'], {
    errorMap: () => ({ message: 'Invalid wallet type' })
  }).optional(),
  balance: z.number().min(0, 'Balance cannot be negative').optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid color format').optional(),
  icon: z.string().max(64, 'Icon name is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional()
})

export const transferFundsSchema = z.object({
  fromWalletId: z.string().min(1, 'Source wallet is required'),
  toWalletId: z.string().min(1, 'Destination wallet is required'),
  amount: z.number().min(0.01, 'Transfer amount must be greater than zero'),
  notes: z.string().max(4000, 'Notes are too long').optional()
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
