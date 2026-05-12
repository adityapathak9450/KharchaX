import { Server } from 'socket.io'

let io

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('socket.io client connected:', socket.id)
    socket.on('disconnect', (reason) => {
      console.log('socket.io disconnected:', socket.id, reason)
    })
  })

  return io
}

export function getIO() {
  return io
}
