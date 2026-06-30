import { motion } from 'framer-motion'
import { RefreshCw, Calendar, DollarSign, Play, Pause, Trash2, SkipForward, Check, AlertCircle, Edit2, Wallet as WalletIcon, Tag } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

function getPaymentStatus(payment) {
  if (!payment.isActive) {
    return { status: 'paused', label: 'Paused', color: 'gray' }
  }

  const now = dayjs()
  const nextDue = dayjs(payment.nextDueDate)
  const diffDays = nextDue.diff(now, 'day')

  if (payment.lastProcessed) {
    const lastProcessed = dayjs(payment.lastProcessed)
    if (lastProcessed.isSame(now, 'day')) {
      return { status: 'paid', label: 'Paid Today', color: 'green' }
    }
  }

  if (diffDays < 0) {
    return { status: 'overdue', label: `Overdue by ${Math.abs(diffDays)} days`, color: 'red' }
  }

  if (diffDays === 0) {
    return { status: 'due-today', label: 'Due Today', color: 'orange' }
  }

  if (diffDays === 1) {
    return { status: 'due-tomorrow', label: 'Due Tomorrow', color: 'yellow' }
  }

  if (payment.isDueSoon) {
    return { status: 'due-soon', label: `Due in ${diffDays} days`, color: 'yellow' }
  }

  return { status: 'upcoming', label: `Next due in ${diffDays} days`, color: 'blue' }
}

function getStatusBadgeStyles(color) {
  const styles = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gray: 'bg-hover text-muted border-border'
  }
  return styles[color] || styles.gray
}

export function RecurringPaymentCard({ payment, onPauseResume, onMarkAsPaid, onSkip, onDelete, onEdit }) {
  const status = getPaymentStatus(payment)
  const statusStyles = getStatusBadgeStyles(status.color)
  const now = dayjs()
  const nextDue = dayjs(payment.nextDueDate)
  const remainingDays = nextDue.diff(now, 'day')

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  }

  const isPayDisabled = !payment.isActive || status.status === 'paid' || remainingDays > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-5 rounded-xl card hover:border-border hover:bg-hover transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            payment.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}>
            <DollarSign className={`w-5 h-5 ${
              payment.type === 'income' ? 'text-green-400' : 'text-red-400'
            }`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{payment.name}</h3>
            <p className="text-xs text-muted">{frequencyLabels[payment.frequency]}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusStyles}`}>
          {status.label}
        </div>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-muted" />
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Category</p>
            <p className="text-xs text-muted">{payment.category?.name || 'Uncategorized'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WalletIcon className="w-3.5 h-3.5 text-muted" />
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Wallet</p>
            <p className="text-xs text-muted">{payment.wallet?.name || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <p className={`text-2xl font-bold ${
          payment.type === 'income' ? 'text-green-400' : 'text-red-400'
        }`}>
          {formatCurrency(payment.amount)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded ${
            payment.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
          </span>
        </div>
      </div>

      {/* Date Information */}
      <div className="mb-4 space-y-2">
        {payment.lastProcessed && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Last Paid</span>
            <span className="text-xs text-muted">{formatDate(payment.lastProcessed)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Next Due</span>
          <span className="text-xs text-muted">{formatDate(payment.nextDueDate)}</span>
        </div>
        {remainingDays > 0 && status.status !== 'paid' && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Remaining</span>
            <span className="text-xs text-muted">{remainingDays} day{remainingDays !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        {status.status === 'paid' || status.status === 'upcoming' ? (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(payment)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-hover text-muted text-xs font-medium hover:bg-hover transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            {payment.isActive && (
              <button
                onClick={() => onPauseResume(payment._id, false)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-hover text-muted text-xs font-medium hover:bg-hover transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}
          </>
        ) : payment.isActive ? (
          <>
            <button
              onClick={() => onMarkAsPaid(payment._id)}
              disabled={isPayDisabled}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isPayDisabled
                  ? 'bg-hover text-muted cursor-not-allowed'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Pay</span>
            </button>
            <button
              onClick={() => onSkip(payment._id)}
              disabled={isPayDisabled}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isPayDisabled
                  ? 'bg-hover text-muted cursor-not-allowed'
                  : 'bg-hover text-muted hover:bg-hover'
              }`}
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
            <button
              onClick={() => onPauseResume(payment._id, false)}
              className="p-2 rounded-lg bg-hover text-muted hover:bg-hover transition-all"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onPauseResume(payment._id, true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Resume</span>
          </button>
        )}
        <button
          onClick={() => onDelete(payment._id)}
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
