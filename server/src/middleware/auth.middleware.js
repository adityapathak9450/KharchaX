import { verifyAccessToken } from '../helpers/tokens.js'
import { AppError } from './error.middleware.js'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!raw) {
    return next(new AppError('Access token required', 401))
  }
  try {
    const payload = verifyAccessToken(raw)
    req.user = { id: payload.sub, email: payload.email }
    return next()
  } catch {
    return next(new AppError('Invalid or expired access token', 401))
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!raw) {
    return next()
  }
  try {
    const payload = verifyAccessToken(raw)
    req.user = { id: payload.sub, email: payload.email }
  } catch {
    req.user = undefined
  }
  return next()
}
