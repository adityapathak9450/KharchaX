import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, CheckCheck, Trash2, Filter, AlertTriangle, RefreshCw, FileText, Users, Wallet, X } from 'lucide-react'
import { useNotifications, useUnreadCount, useMarkOneRead, useMarkAllRead, useDeleteNotification, useClearAllNotifications } from '../../hooks/useNotifications'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const TYPE_META = {
  budget_alert:    { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10', label: 'Budget Alert' },
  budget_exceeded: { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',   label: 'Budget Exceeded' },
  recurring_due:   { icon: RefreshCw,     color: 'text-blue-400',   bg: 'bg-blue-500/10',  label: 'Recurring Payment' },
  report_ready:    { icon: FileText,      color: 'text-green-400',  bg: 'bg-green-500/10', label: 'Report Ready' },
  shared_wallet:   { icon: Users,         color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Shared Wallet' },
  transaction:     { icon: Wallet,        color: 'text-primary', bg: 'bg-primary/10', label: 'Transaction' },
  default:         { icon: Bell,          color: 'text-muted',   bg: 'bg-hover',      label: 'Notification' },
}

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState('all')
  const [filterRead, setFilterRead] = useState('all')
  const [page, setPage] = useState(1)

  const { data: unreadCount = 0 } = useUnreadCount()
  const { data, isLoading, refetch } = useNotifications({ 
    page, 
    limit: 20,
    isRead: filterRead === 'all' ? undefined : filterRead === 'read',
    type: filterType === 'all' ? undefined : filterType
  })
  const markOne = useMarkOneRead()
  const markAll = useMarkAllRead()
  const deleteOne = useDeleteNotification()
  const clearAll = useClearAllNotifications()

  const notifications = data?.notifications ?? []
  const pagination = data?.pagination ?? { total: 0, pages: 1, hasMore: false }

  const handleMarkAllRead = () => {
    markAll.mutate()
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAll.mutate()
    }
  }

  const handleMarkRead = (id) => {
    markOne.mutate(id)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this notification?')) {
      deleteOne.mutate(id)
    }
  }

  const filteredCount = notifications.length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAll.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border shadow-sm text-muted hover:bg-hover hover:text-foreground transition-all disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="text-sm">Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearAll.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Clear all</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
            className="px-3 py-2 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Types</option>
            <option value="budget_alert">Budget Alert</option>
            <option value="budget_exceeded">Budget Exceeded</option>
            <option value="recurring_due">Recurring Due</option>
            <option value="report_ready">Report Ready</option>
            <option value="shared_wallet">Shared Wallet</option>
            <option value="transaction">Transaction</option>
          </select>
        </div>

        {/* Read Status Filter */}
        <select
          value={filterRead}
          onChange={(e) => { setFilterRead(e.target.value); setPage(1) }}
          className="px-3 py-2 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <div className="ml-auto text-sm text-muted">
          {filteredCount} of {pagination.total} notifications
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-elevated flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-elevated rounded w-3/4" />
                <div className="h-3 bg-elevated rounded w-full" />
                <div className="h-3 bg-elevated rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-hover flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No notifications</h3>
          <p className="text-sm text-muted">
            {filterType !== 'all' || filterRead !== 'all' 
              ? 'Try adjusting your filters' 
              : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type] || TYPE_META.default
            const Icon = meta.icon
            const timeAgo = notification.createdAt ? dayjs(notification.createdAt).fromNow() : ''

            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative flex gap-4 p-4 rounded-xl border transition-all group
                  ${notification.isRead 
                    ? 'bg-transparent border-border/50 opacity-60' 
                    : 'bg-surface border-border'}`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground">{notification.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-hover text-muted">
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted mb-2">{notification.message}</p>
                      <p className="text-xs text-muted">{timeAgo}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification._id)}
                      title="Mark as read"
                      className="p-2 rounded-lg hover:bg-hover text-muted hover:text-green-400 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    title="Delete"
                    className="p-2 rounded-lg hover:bg-hover text-muted hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
