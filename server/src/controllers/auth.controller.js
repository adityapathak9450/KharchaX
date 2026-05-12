import crypto from 'node:crypto'
import User from '../models/User.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import { sendMail } from '../services/mailService.js'
import { verificationEmail, passwordResetEmail } from '../helpers/emailTemplates.js'
import { hashResetToken } from '../helpers/hashToken.js'
import { verifyRefreshToken } from '../helpers/tokens.js'

const REFRESH_COOKIE = 'refreshToken'

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  }
}

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

async function sendVerificationEmail(to, name, otp) {
  const html = verificationEmail(otp, name)
  const text = `Your VaultX verification code is ${otp}. It expires in 15 minutes.`
  const sent = await sendMail({
    to,
    subject: 'Verify your VaultX email',
    html,
    text,
  })
  if (!sent) {
    console.warn('[auth] SMTP not configured; verification OTP (dev):', otp)
  }
  return sent
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  const taken = await User.exists({ email })
  if (taken) {
    throw new AppError('Email is already registered', 409)
  }

  const otp = generateOtp()
  const verifyTokenExpiry = new Date(Date.now() + 15 * 60 * 1000)

  const user = await User.create({
    name,
    email,
    password,
    verifyToken: otp,
    verifyTokenExpiry,
    isVerified: false,
  })

  await sendVerificationEmail(user.email, user.name, otp)

  res.status(201).json({
    success: true,
    message: 'Account created. Please verify your email with the code we sent.',
    data: { user: user.toJSON() },
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password +refreshTokens')
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.isVerified) {
    const otp = generateOtp()
    user.verifyToken = otp
    user.verifyTokenExpiry = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()
    await sendVerificationEmail(user.email, user.name, otp)
    return res.status(403).json({
      success: false,
      message: 'Email not verified. A new verification code has been sent to your inbox.',
      errors: { code: 'EMAIL_NOT_VERIFIED' },
    })
  }

  const accessToken = user.generateJWT()
  const refreshToken = user.generateRefreshToken()

  await User.updateOne({ _id: user._id }, { $push: { refreshTokens: refreshToken } })

  res.cookie(REFRESH_COOKIE, refreshToken, getRefreshCookieOptions())

  const safeUser = await User.findById(user._id)
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      user: safeUser.toJSON(),
    },
  })
})

export const refreshToken = asyncHandler(async (req, res) => {
  const oldToken = req.cookies[REFRESH_COOKIE]
  if (!oldToken) {
    throw new AppError('Refresh token missing', 401)
  }

  let payload
  try {
    payload = verifyRefreshToken(oldToken)
  } catch {
    res.clearCookie(REFRESH_COOKIE, getClearCookieOptions())
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const user = await User.findById(payload.sub).select('+refreshTokens')
  if (!user || !user.refreshTokens.includes(oldToken)) {
    res.clearCookie(REFRESH_COOKIE, getClearCookieOptions())
    throw new AppError('Invalid or expired refresh session', 401)
  }

  const newRefresh = user.generateRefreshToken()
  user.refreshTokens = user.refreshTokens.filter((t) => t !== oldToken)
  user.refreshTokens.push(newRefresh)
  await user.save()

  const accessToken = user.generateJWT()
  res.cookie(REFRESH_COOKIE, newRefresh, getRefreshCookieOptions())

  return res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken },
  })
})

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE]
  res.clearCookie(REFRESH_COOKIE, getClearCookieOptions())

  if (token) {
    try {
      const payload = verifyRefreshToken(token)
      await User.updateOne({ _id: payload.sub }, { $pull: { refreshTokens: token } })
    } catch {
      /* ignore invalid cookie */
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body
  const user = await User.findOne({
    verifyToken: token,
    verifyTokenExpiry: { $gt: new Date() },
  }).select('+verifyToken')

  if (!user) {
    throw new AppError('Invalid or expired verification code', 400)
  }

  user.isVerified = true
  user.verifyToken = null
  user.verifyTokenExpiry = null
  await user.save()

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: { user: user.toJSON() },
  })
})

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user || user.isVerified) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists and is unverified, a verification email has been sent.',
    })
  }

  const otp = generateOtp()
  user.verifyToken = otp
  user.verifyTokenExpiry = new Date(Date.now() + 15 * 60 * 1000)
  await user.save()
  await sendVerificationEmail(user.email, user.name, otp)

  return res.status(200).json({
    success: true,
    message: 'If an account exists and is unverified, a verification email has been sent.',
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    })
  }

  const plain = crypto.randomBytes(32).toString('hex')
  user.resetToken = hashResetToken(plain)
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)
  await user.save()

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  const resetLink = `${clientUrl}/reset-password?token=${plain}`
  const html = passwordResetEmail(resetLink, user.name)
  const text = `Reset your VaultX password: ${resetLink}`

  const sent = await sendMail({
    to: user.email,
    subject: 'Reset your VaultX password',
    html,
    text,
  })
  if (!sent) {
    console.warn('[auth] SMTP not configured. Dev reset link:', resetLink)
  }

  return res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body
  const hashed = hashResetToken(token)

  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpiry: { $gt: new Date() },
  }).select('+password +refreshTokens')

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400)
  }

  user.password = newPassword
  user.resetToken = null
  user.resetTokenExpiry = null
  user.refreshTokens = []
  await user.save()

  res.clearCookie(REFRESH_COOKIE, getClearCookieOptions())

  return res.status(200).json({
    success: true,
    message: 'Password reset successful. Please sign in again.',
  })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }
  return res.status(200).json({
    success: true,
    message: 'OK',
    data: { user: user.toJSON() },
  })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body }
  if (updates.currency) {
    updates.currency = String(updates.currency).toUpperCase()
  }

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  return res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: { user: user.toJSON() },
  })
})
