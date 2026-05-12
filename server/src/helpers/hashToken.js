import crypto from 'node:crypto'

export function hashResetToken(plain) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return crypto.createHmac('sha256', secret).update(plain).digest('hex')
}
