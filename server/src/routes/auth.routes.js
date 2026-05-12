import { Router } from 'express'
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  validateBody,
} from '../validators/auth.validator.js'

const router = Router()

router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.post('/logout', logout)
router.post('/refresh-token', refreshToken)
router.post('/verify-email', validateBody(verifyEmailSchema), verifyEmail)
router.post('/resend-verification', validateBody(resendVerificationSchema), resendVerification)
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword)
router.get('/me', authenticate, me)
router.put('/update-profile', authenticate, validateBody(updateProfileSchema), updateProfile)

export default router
