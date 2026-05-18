import { motion } from 'framer-motion'
import { MoreHorizontal, AlertTriangle, TrendingUp, Target, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format.js'

export function BudgetCard({ budget, onDelete, onEdit }) {
  const utilizationPercent = budget.utilizationPercent || 0
  const isExceeded = budget.isExceeded || false
  const shouldAlert = budget.shouldAlert || false
  const remaining = budget.amount - budget.spent
  const progressColor = isExceeded ? 'bg-red-500' : shouldAlert ? 'bg-yellow-500' : 'bg-green-500'
  const progressBgColor = isExceeded ? 'bg-red-500/20' : shouldAlert ? 'bg-yellow-500/20' : 'bg-green-500/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 backdrop-blur-sm transition-all hover:border-white/20"
    >
      {/* Status indicator */}
      {isExceeded && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-xs text-red-400">Exceeded</span>
          </div>
        </div>
      )}
      
      {shouldAlert && !isExceeded && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
            <TrendingUp className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">Alert</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
            style={{ backgroundColor: `${budget.color}20`, color: budget.color }}
          >
            {budget.category?.icon || <Target className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-white">{budget.name}</h4>
            <p className="text-xs text-gray-400">
              {budget.category?.name || 'Uncategorized'}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Add dropdown menu with edit/delete options
          }}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className={`font-medium ${
            isExceeded ? 'text-red-400' : 
            shouldAlert ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            {utilizationPercent.toFixed(1)}%
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>
          
          {/* Alert threshold line */}
          {budget.alertAt && budget.alertAt < 100 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-yellow-400/50"
              style={{ left: `${budget.alertAt}%` }}
            />
          )}
        </div>
      </div>

      {/* Amount Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Spent</span>
          <span className="text-white font-medium">{formatCurrency(budget.spent)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Budget</span>
          <span className="text-white font-medium">{formatCurrency(budget.amount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
          <span className="text-gray-400">Remaining</span>
          <span className={`font-medium ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && ' over'}
          </span>
        </div>
      </div>

      {/* Time Period */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/10">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long' })} {budget.year}
          </span>
        </div>
        <span>Alert at {budget.alertAt}%</span>
      </div>

      {/* Accent border */}
      <div 
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ backgroundColor: budget.color }}
      />
    </motion.div>
  )
}
