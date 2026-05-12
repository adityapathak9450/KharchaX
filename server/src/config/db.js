import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

export default async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MongoDB connection error: MONGO_URI is not defined')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })
}
