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
const max = Number(process.env.RATE_LIMIT_MAX) || 100

app.use(
  '/api',
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use('/api', routes)

app.use(errorHandler)

export default app
