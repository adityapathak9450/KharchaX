import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

/**
 * Singleton Socket.io client instance.
 *
 * - autoConnect: false  → we connect manually in useSocket after auth token is ready
 * - reconnection: true  → auto-reconnect with exponential backoff
 * - auth token         → set dynamically before connect() is called
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  transports: ['websocket', 'polling'], // prefer WS, fallback to polling
  auth: { token: '' }, // token is set dynamically in useSocket
})
