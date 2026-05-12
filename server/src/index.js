import 'dotenv/config'
import http from 'http'
import app from './app.js'
import connectDB from './config/db.js'
import { seedDefaultCategories } from './jobs/seedCategories.js'
import { seedDevData } from './config/seed.js'
import { initSocket } from './sockets/index.js'

const PORT = Number(process.env.PORT) || 5000

await connectDB()
await seedDefaultCategories()
await seedDevData()

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
