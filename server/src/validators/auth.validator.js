import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
    'Password must include uppercase, number, and special character',
  )

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .trim()
    .length(64, 'Invalid reset token')
    .regex(/^[a-f0-9]+$/i, 'Invalid reset token'),
  newPassword: passwordSchema,
})

export const verifyEmailSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
})

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
})

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    avatar: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    currency: z.string().trim().length(3).optional(),
    preferences: z.record(z.string(), z.any()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' })

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
