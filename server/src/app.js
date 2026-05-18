import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import routes from './routes/index.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const windowMs = Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000
const max = Number(process.env.RATE_LIMIT_MAX) || 1000

// Separate rate limiters for different API types
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Higher limit for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Much higher limit for general APIs
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(
  '/api',
  (req, res, next) => {
    // Skip rate limiting for dashboard APIs
    if (req.path.startsWith('/analytics/') || 
        req.path.startsWith('/wallets') || 
        req.path.startsWith('/transactions') || 
        req.path.startsWith('/budgets') || 
        req.path.startsWith('/categories')) {
      return next()
    }
    
    return generalLimiter(req, res, next)
  },
)

app.use('/api', routes)

app.use(errorHandler)

export default app
