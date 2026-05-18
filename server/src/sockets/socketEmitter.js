/**
 * socketEmitter.js
 * Central helper module for emitting Socket.io events from anywhere in the server.
 *
 * Usage:
 *   import { emitToUser } from '../sockets/socketEmitter.js'
 *   emitToUser(userId, 'notification:new', { title: '...', message: '...' })
 */

import { getIO } from './index.js'

/**
 * Emit an event to a specific user's room.
 * Every authenticated socket auto-joins a room named after userId.
 *
 * @param {string|object} userId  - MongoDB ObjectId or string
 * @param {string}        event   - Socket event name
 * @param {object}        payload - Data to send
 */
export function emitToUser(userId, event, payload = {}) {
  try {
    const io = getIO()
    const room = String(userId)
    io.to(room).emit(event, { ...payload, _ts: Date.now() })
  } catch (err) {
    // Socket not initialised yet (e.g. during tests) — fail silently
    console.warn(`[socketEmitter] emitToUser failed: ${err.message}`)
  }
}

/**
 * Emit an event to a named room (e.g. shared wallet room).
 *
 * @param {string} room    - Room name
 * @param {string} event   - Socket event name
 * @param {object} payload - Data to send
 */
export function emitToRoom(room, event, payload = {}) {
  try {
    const io = getIO()
    io.to(String(room)).emit(event, { ...payload, _ts: Date.now() })
  } catch (err) {
    console.warn(`[socketEmitter] emitToRoom failed: ${err.message}`)
  }
}

/**
 * Emit an event to ALL connected clients.
 * Use sparingly — only for system-wide broadcasts.
 *
 * @param {string} event   - Socket event name
 * @param {object} payload - Data to send
 */
export function emitBroadcast(event, payload = {}) {
  try {
    const io = getIO()
    io.emit(event, { ...payload, _ts: Date.now() })
  } catch (err) {
    console.warn(`[socketEmitter] emitBroadcast failed: ${err.message}`)
  }
}

// ─── Typed event helpers ────────────────────────────────────────────────────
// These enforce consistent payload shapes across the codebase.

/**
 * Emit a new notification to a user.
 * @param {string} userId
 * @param {{ _id, title, message, type, relatedId? }} notification
 */
export function emitNotification(userId, notification) {
  emitToUser(userId, 'notification:new', { notification })
}

/**
 * Emit a budget alert to a user.
 * @param {string} userId
 * @param {{ budget, spent, limit, utilization, type }} data
 */
export function emitBudgetAlert(userId, data) {
  emitToUser(userId, 'budget:alert', data)
}

/**
 * Emit a transaction event to a user.
 * @param {string} userId
 * @param {'created'|'updated'|'deleted'} action
 * @param {object} transaction
 */
export function emitTransactionEvent(userId, action, transaction) {
  emitToUser(userId, `transaction:${action}`, { action, transaction })
}

/**
 * Emit a wallet update event to a user.
 * @param {string} userId
 * @param {'created'|'updated'|'deleted'|'transfer'} action
 * @param {object} wallet
 */
export function emitWalletEvent(userId, action, wallet) {
  emitToUser(userId, 'wallet:updated', { action, wallet })
}

/**
 * Emit report status to a user.
 * @param {string} userId
 * @param {'ready'|'failed'} status
 * @param {{ fileUrl?, reportId?, error? }} data
 */
export function emitReportEvent(userId, status, data = {}) {
  emitToUser(userId, `report:${status}`, data)
}

/**
 * Emit a recurring payment due alert.
 * @param {string} userId
 * @param {object} recurringPayment
 */
export function emitRecurringDue(userId, recurringPayment) {
  emitToUser(userId, 'recurring:due', { recurringPayment })
}

/**
 * Emit a shared wallet activity update to a room.
 * @param {string} sharedWalletId
 * @param {object} data
 */
export function emitSharedWalletUpdate(sharedWalletId, data) {
  emitToRoom(`shared:${sharedWalletId}`, 'sharedWallet:updated', data)
}
