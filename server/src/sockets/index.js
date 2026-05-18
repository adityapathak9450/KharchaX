import { Server } from 'socket.io'
import { verifyAccessToken } from '../helpers/tokens.js'

/** @type {Server} */
let io

/** userId (string) → Set of socket IDs */
const onlineUsers = new Map()

// ─── Helpers ───────────────────────────────────────────────────────────────

function addOnlineUser(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
  onlineUsers.get(userId).add(socketId)
}

function removeOnlineUser(userId, socketId) {
  const sockets = onlineUsers.get(userId)
  if (!sockets) return
  sockets.delete(socketId)
  if (sockets.size === 0) onlineUsers.delete(userId)
}

export function isUserOnline(userId) {
  return onlineUsers.has(String(userId))
}

export function getOnlineCount() {
  return onlineUsers.size
}

// ─── Initialise ────────────────────────────────────────────────────────────

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // reconnection settings exposed to clients
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // ── JWT middleware ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Authentication error: no token provided'))
    }

    try {
      const payload = verifyAccessToken(token)
      // Attach user info to the socket so handlers can read it
      socket.userId = String(payload.sub)
      socket.userEmail = payload.email
      return next()
    } catch {
      return next(new Error('Authentication error: invalid or expired token'))
    }
  })

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId } = socket

    // Join a room named after the user so we can emit to them by userId
    socket.join(userId)
    addOnlineUser(userId, socket.id)

    console.log(
      `[socket] connected  | user=${userId} socket=${socket.id} online=${getOnlineCount()}`,
    )

    // ── Client-driven events ─────────────────────────────────────────────
    // Allow client to manually join extra rooms (e.g. shared wallet rooms)
    socket.on('join:room', (room) => {
      if (typeof room === 'string' && room.length < 64) {
        socket.join(room)
      }
    })

    socket.on('leave:room', (room) => {
      if (typeof room === 'string') {
        socket.leave(room)
      }
    })

    // Heartbeat / ping-pong so client can check liveness
    socket.on('ping', () => socket.emit('pong'))

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      removeOnlineUser(userId, socket.id)
      console.log(
        `[socket] disconnected | user=${userId} socket=${socket.id} reason=${reason} online=${getOnlineCount()}`,
      )
    })

    socket.on('error', (err) => {
      console.error(`[socket] error | user=${userId} socket=${socket.id}`, err.message)
    })
  })

  return io
}

// ─── Getter ────────────────────────────────────────────────────────────────

export function getIO() {
  if (!io) throw new Error('Socket.io not initialised — call initSocket() first')
  return io
}
