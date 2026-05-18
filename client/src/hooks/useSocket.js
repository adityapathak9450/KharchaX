import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// ─── Currency formatter (inline to avoid circular imports) ─────────────────
function fmt(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

/**
 * useSocket
 *
 * Initialises the Socket.io connection once the user has a valid accessToken.
 * - Connects with JWT token in handshake.auth
 * - Registers all server → client event listeners
 * - Invalidates React Query caches on relevant events
 * - Cleans up listeners & disconnects on token loss / unmount
 *
 * Call once in DashboardLayout — do NOT call in individual pages.
 *
 * @returns {object} { socket, isConnected }
 */
export function useSocket() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const isConnectedRef = useRef(false)

  // ── Stable invalidation helper ─────────────────────────────────────────
  const invalidate = useCallback(
    (...keys) => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] }))
    },
    [queryClient],
  )

  useEffect(() => {
    if (!accessToken) {
      // No token — ensure socket is disconnected
      if (socket.connected) socket.disconnect()
      return
    }

    // Set / refresh auth token then connect (or reconnect if token changed)
    socket.auth = { token: accessToken }

    if (!socket.connected) {
      socket.connect()
    }

    // ── Connection lifecycle ─────────────────────────────────────────────
    function onConnect() {
      isConnectedRef.current = true
      console.log('[socket] connected:', socket.id)
    }

    function onDisconnect(reason) {
      isConnectedRef.current = false
      console.log('[socket] disconnected:', reason)
      // If server kicked us, don't auto-reconnect
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    }

    function onConnectError(err) {
      console.warn('[socket] connect error:', err.message)
    }

    function onReconnect(attempt) {
      console.log(`[socket] reconnected after ${attempt} attempt(s)`)
    }

    // ── Domain events ────────────────────────────────────────────────────

    // notification:new
    function onNotificationNew(data) {
      // Refresh notification list so the bell badge updates
      invalidate('notifications')
      // Show a toast based on notification type
      const icons = {
        budget_alert: '⚠️',
        budget_exceeded: '🚨',
        recurring_due: '🔔',
        report_ready: '📄',
        shared_wallet: '👥',
        transaction: '💸',
      }
      const icon = icons[data?.notification?.type] || '🔔'
      toast(`${icon} ${data?.notification?.message || 'New notification'}`, { duration: 4000 })
    }

    // budget:alert — emitted by budgetService after every expense
    function onBudgetAlert(data) {
      invalidate('budgets', 'dashboard-stats', 'analytics')

      const msgs = {
        exceeded: `🚨 Budget exceeded! You've used ${data.utilization}% of "${data.budget?.name}"`,
        warning:  `⚠️ Budget warning! ${data.utilization}% used on "${data.budget?.name}"`,
        near_limit:`🔶 Approaching limit: ${data.utilization}% on "${data.budget?.name}"`,
      }
      toast(msgs[data.type] || `Budget alert: ${data.budget?.name}`, {
        duration: 6000,
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
      })
    }

    // transaction:created / transaction:updated / transaction:deleted
    function onTransactionCreated(data) {
      invalidate('transactions', 'dashboard-stats', 'analytics', 'wallets', 'budgets')
      const t = data.transaction
      if (t) {
        toast.success(
          `${t.type === 'income' ? '📈 Income' : '📉 Expense'} of ${fmt(t.amount)} recorded`,
          { duration: 3000 },
        )
      }
    }

    function onTransactionUpdated(data) {
      invalidate('transactions', 'dashboard-stats', 'analytics', 'wallets', 'budgets')
    }

    function onTransactionDeleted(data) {
      invalidate('transactions', 'dashboard-stats', 'analytics', 'wallets', 'budgets')
    }

    // wallet:updated — covers create, update, delete, transfer
    function onWalletUpdated(data) {
      invalidate('wallets', 'dashboard-stats', 'analytics')

      if (data.action === 'transfer') {
        toast.success(
          `💸 Transferred ${fmt(data.amount)} from "${data.fromWallet?.name}" to "${data.toWallet?.name}"`,
          { duration: 3000 },
        )
      } else if (data.action === 'created') {
        toast.success(`✅ Wallet "${data.wallet?.name}" created`, { duration: 3000 })
      }
    }

    // report:ready — emitted when PDF/CSV generation finishes
    function onReportReady(data) {
      invalidate('reports')
      toast.success('📄 Your report is ready!', {
        duration: 10000,
        onClick: () => data.fileUrl && window.open(data.fileUrl, '_blank'),
      })
    }

    // report:failed
    function onReportFailed() {
      toast.error('❌ Report generation failed. Please try again.')
    }

    // recurring:due — a recurring payment is overdue
    function onRecurringDue(data) {
      invalidate('recurring')
      const rp = data.recurringPayment
      toast(`🔔 Recurring payment due: "${rp?.name}" — ${fmt(rp?.amount)}`, {
        duration: 8000,
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(245,158,11,0.4)' },
      })
    }

    // sharedWallet:updated — shared wallet room event
    function onSharedWalletUpdated(data) {
      invalidate('shared-wallets', ['shared-wallet', data.sharedWalletId])
    }

    // budget:updated (generic refresh)
    function onBudgetUpdated() {
      invalidate('budgets', 'dashboard-stats')
    }

    // activity:new
    function onActivityNew() {
      invalidate('activities')
    }

    // pong (heartbeat response)
    function onPong() {
      // no-op — just confirms liveness
    }

    // ── Register listeners ───────────────────────────────────────────────
    socket.on('connect',            onConnect)
    socket.on('disconnect',         onDisconnect)
    socket.on('connect_error',      onConnectError)
    socket.on('reconnect',          onReconnect)

    socket.on('notification:new',   onNotificationNew)
    socket.on('budget:alert',       onBudgetAlert)
    socket.on('budget:updated',     onBudgetUpdated)
    socket.on('transaction:created',onTransactionCreated)
    socket.on('transaction:updated',onTransactionUpdated)
    socket.on('transaction:deleted',onTransactionDeleted)
    socket.on('wallet:updated',     onWalletUpdated)
    socket.on('report:ready',       onReportReady)
    socket.on('report:failed',      onReportFailed)
    socket.on('recurring:due',      onRecurringDue)
    socket.on('sharedWallet:updated', onSharedWalletUpdated)
    socket.on('activity:new',       onActivityNew)
    socket.on('pong',               onPong)

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      socket.off('connect',            onConnect)
      socket.off('disconnect',         onDisconnect)
      socket.off('connect_error',      onConnectError)
      socket.off('reconnect',          onReconnect)

      socket.off('notification:new',   onNotificationNew)
      socket.off('budget:alert',       onBudgetAlert)
      socket.off('budget:updated',     onBudgetUpdated)
      socket.off('transaction:created',onTransactionCreated)
      socket.off('transaction:updated',onTransactionUpdated)
      socket.off('transaction:deleted',onTransactionDeleted)
      socket.off('wallet:updated',     onWalletUpdated)
      socket.off('report:ready',       onReportReady)
      socket.off('report:failed',      onReportFailed)
      socket.off('recurring:due',      onRecurringDue)
      socket.off('sharedWallet:updated', onSharedWalletUpdated)
      socket.off('activity:new',       onActivityNew)
      socket.off('pong',               onPong)

      socket.disconnect()
    }
  }, [accessToken, invalidate])

  return socket
}
