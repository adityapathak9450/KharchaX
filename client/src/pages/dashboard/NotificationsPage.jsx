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
  transaction:     { icon: Wallet,        color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Transaction' },
  default:         { icon: Bell,          color: 'text-gray-400',   bg: 'bg-white/5',      label: 'Notification' },
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAll.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="text-sm">Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearAll.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
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
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
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
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <div className="ml-auto text-sm text-gray-500">
          {filteredCount} of {pagination.total} notifications
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No notifications</h3>
          <p className="text-sm text-gray-500">
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
                    ? 'bg-transparent border-white/5 opacity-60' 
                    : 'bg-white/[0.03] border-white/[0.08]'}`}
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
                        <h3 className="text-sm font-medium text-white">{notification.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-600">{timeAgo}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification._id)}
                      title="Mark as read"
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-green-400 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    title="Delete"
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500" />
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
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
