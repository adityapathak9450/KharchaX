export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.isOperational = isOperational
  }
}

function formatMongooseValidation(err) {
  return Object.values(err.errors || {}).map((e) => ({
    field: e.path,
    message: e.message,
  }))
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  let statusCode = err.statusCode || err.status || 500
  let message = err.message || 'Internal server error'
  let errors

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation failed'
    errors = formatMongooseValidation(err)
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid identifier'
  } else if (err.code === 11000) {
    statusCode = 409
    message = 'Duplicate field value'
    const key = err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined
    if (key) errors = { field: key }
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Invalid or expired token'
  } else if (!err.isOperational && process.env.NODE_ENV === 'production') {
    statusCode = 500
    message = 'Something went wrong'
  }

  const body = {
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'production') {
    body.stack = err.stack
  }

  return res.status(statusCode).json(body)
}
