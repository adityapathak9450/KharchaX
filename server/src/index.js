import 'dotenv/config'
import http from 'http'
import cron from 'node-cron'
import app from './app.js'
import connectDB from './config/db.js'
import { seedDefaultCategories } from './jobs/seedCategories.js'
import { seedDevData } from './config/seed.js'
import { initSocket } from './sockets/index.js'
import { processRecurringPayments, checkDueSoonReminders } from './jobs/recurringPayments.js'

const PORT = Number(process.env.PORT) || 5000

await connectDB()
await seedDefaultCategories()
await seedDevData()

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})

// Schedule cron jobs
// Process recurring payments daily at midnight
cron.schedule('0 0 * * *', () => {
  processRecurringPayments()
})

// Check for due soon reminders every hour
cron.schedule('0 * * * *', () => {
  checkDueSoonReminders()
})

console.log('[Cron] Recurring payment jobs scheduled')
