import { motion } from 'framer-motion'
import { RefreshCw, Calendar, DollarSign, Play, Pause, Trash2, SkipForward, Check, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../../utils/format'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function RecurringPaymentCard({ payment, onPauseResume, onMarkAsPaid, onSkip, onDelete }) {
  const isDueSoon = payment.isDueSoon
  const isOverdue = new Date(payment.nextDueDate) < new Date()
  const nextDue = dayjs(payment.nextDueDate).fromNow()

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all group"
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
            <h3 className="text-sm font-semibold text-white">{payment.name}</h3>
            <p className="text-xs text-gray-500">{frequencyLabels[payment.frequency]}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          payment.isActive
            ? 'bg-green-500/10 text-green-400'
            : 'bg-gray-500/10 text-gray-400'
        }`}>
          {payment.isActive ? 'Active' : 'Paused'}
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <p className={`text-2xl font-bold ${
          payment.type === 'income' ? 'text-green-400' : 'text-red-400'
        }`}>
          {payment.type === 'income' ? '+' : '-'}{formatCurrency(payment.amount)}
        </p>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className={`w-4 h-4 ${
          isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-gray-500'
        }`} />
        <span className={`text-sm ${
          isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-gray-400'
        }`}>
          {isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : 'Due'} {nextDue}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/[0.08]">
        {payment.isActive ? (
          <>
            <button
              onClick={() => onMarkAsPaid(payment._id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Pay</span>
            </button>
            <button
              onClick={() => onSkip(payment._id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-xs font-medium hover:bg-white/10 transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
            <button
              onClick={() => onPauseResume(payment._id, false)}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onPauseResume(payment._id, true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-all"
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

      {/* Due Soon Badge */}
      {isDueSoon && !isOverdue && (
        <div className="absolute top-2 right-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
        </div>
      )}
    </motion.div>
  )
}
