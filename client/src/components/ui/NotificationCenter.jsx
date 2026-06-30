import { useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, FileText, Wallet, RefreshCw, Users } from 'lucide-react'

dayjs.extend(relativeTime)
import { useUnreadCount, useNotifications, useMarkOneRead, useMarkAllRead, useDeleteNotification, useClearAllNotifications } from '../../hooks/useNotifications'

// ─── Type → icon + color mapping ──────────────────────────────────────────
const TYPE_META = {
  budget_alert:   { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  budget_exceeded:{ icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10'   },
  recurring_due:  { icon: RefreshCw,     color: 'text-blue-400',   bg: 'bg-blue-500/10'  },
  report_ready:   { icon: FileText,      color: 'text-green-400',  bg: 'bg-green-500/10' },
  shared_wallet:  { icon: Users,         color: 'text-purple-400', bg: 'bg-purple-500/10'},
  transaction:    { icon: Wallet,        color: 'text-primary', bg: 'bg-primary/10'},
  default:        { icon: Bell,          color: 'text-muted',   bg: 'bg-hover'      },
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const meta  = TYPE_META[notification.type] || TYPE_META.default
  const Icon  = meta.icon
  const timeAgo = notification.createdAt ? dayjs(notification.createdAt).fromNow() : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={`relative flex gap-3 p-3 rounded-xl transition-all group cursor-default
        ${notification.isRead ? 'opacity-70' : 'notification-unread'}
        hover:bg-hover`}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground leading-snug">{notification.title}</p>
        <p className="text-xs text-muted mt-0.5 leading-snug">{notification.message}</p>
        <p className="text-[10px] text-muted mt-1">{timeAgo}</p>
      </div>

      {/* Actions — visible on hover */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notification._id) }}
            title="Mark as read"
            className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-green-400 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification._id) }}
          title="Delete"
          className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function SkeletonItem() {
  return (
    <div className="flex gap-3 p-3" aria-hidden="true">
      <div className="w-8 h-8 rounded-lg skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-2 w-full" />
        <div className="skeleton h-2 w-1/3" />
      </div>
    </div>
  )
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Hooks
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data, isLoading } = useNotifications({ limit: 25 })
  const markOne      = useMarkOneRead()
  const markAll      = useMarkAllRead()
  const deleteOne    = useDeleteNotification()
  const clearAll     = useClearAllNotifications()

  const notifications = data?.notifications ?? []

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleMarkAllRead = () => markAll.mutate()
  const handleClearAll    = () => {
    clearAll.mutate()
    setOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-all focus-ring"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.96, y: -8  }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-[380px] max-h-[520px] flex flex-col dropdown-panel z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markAll.isPending}
                    title="Mark all as read"
                    className="flex items-center gap-1 text-xs text-muted hover:text-primary px-2 py-1 rounded-lg hover:bg-hover transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>All read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={clearAll.isPending}
                    title="Clear all"
                    className="flex items-center gap-1 text-xs text-muted hover:text-red-400 px-2 py-1 rounded-lg hover:bg-hover transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-all ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <>
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                </>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-hover flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-muted" />
                  </div>
                  <p className="text-sm text-muted font-medium">All caught up!</p>
                  <p className="text-xs text-muted mt-1">No notifications yet.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n._id}
                      notification={n}
                      onMarkRead={(id) => markOne.mutate(id)}
                      onDelete={(id) => deleteOne.mutate(id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border text-center">
                <a
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  View all notifications →
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
