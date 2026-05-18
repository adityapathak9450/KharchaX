import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

export function BudgetProgress({ budget }) {
  const utilizationPercent = budget.utilizationPercent || 0
  const isExceeded = budget.isExceeded || false
  const shouldAlert = budget.shouldAlert || false
  const remaining = budget.amount - budget.spent

  const getProgressColor = () => {
    if (isExceeded) return 'bg-red-500'
    if (shouldAlert) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressBgColor = () => {
    if (isExceeded) return 'bg-red-500/20'
    if (shouldAlert) return 'bg-yellow-500/20'
    return 'bg-green-500/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: budget.color }}
          />
          <span className="text-sm font-medium text-white">
            {budget.name}
          </span>
          {budget.category?.name && (
            <span className="text-xs text-gray-400">
              ({budget.category.name})
            </span>
          )}
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-1">
          {isExceeded && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Exceeded</span>
            </div>
          )}
          {shouldAlert && !isExceeded && (
            <div className="flex items-center gap-1 text-yellow-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatCurrency(budget.spent)} spent</span>
          <span>{formatCurrency(remaining)} left</span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${getProgressColor()}`}
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
        
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${
            isExceeded ? 'text-red-400' : 
            shouldAlert ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            {utilizationPercent.toFixed(1)}% used
          </span>
          <span className="text-gray-500">
            {formatCurrency(budget.amount)} total
          </span>
        </div>
      </div>
    </motion.div>
  )
}
