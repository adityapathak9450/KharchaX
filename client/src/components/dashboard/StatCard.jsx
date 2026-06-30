import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

const colorClasses = {
  blue: 'border-blue-500/20 bg-blue-500/5',
  green: 'border-green-500/20 bg-green-500/5',
  red: 'border-red-500/20 bg-red-500/5',
  purple: 'border-purple-500/20 bg-purple-500/5',
}

const iconColorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
}

const iconBgClasses = {
  blue: 'bg-blue-500/10',
  green: 'bg-green-500/10',
  red: 'bg-red-500/10',
  purple: 'bg-purple-500/10',
}

export function StatCard({ title, value, change, icon: Icon, color = 'blue' }) {
  const changeValue = change?.value || 0
  const isPositive = changeValue > 0
  const isNegative = changeValue < 0
  const isNeutral = changeValue === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`card-interactive p-6 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-3 ${iconBgClasses[color]}`}>
            <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              {formatCurrency(value)}
            </p>
          </div>
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1 mt-4">
          {isPositive && <ArrowUp className="h-3 w-3 text-green-500" />}
          {isNegative && <ArrowDown className="h-3 w-3 text-red-500" />}
          {isNeutral && <Minus className="h-3 w-3 text-muted" />}
          
          <span className={`text-xs font-medium ${
            isPositive ? 'text-green-600' : 
            isNegative ? 'text-red-600' : 
            'text-muted'
          }`}>
            {isPositive && '+'}
            {changeValue.toFixed(1)}%
            <span className="text-muted ml-1 font-normal">
              {change?.period || 'vs last period'}
            </span>
          </span>
        </div>
      )}
    </motion.div>
  )
}
