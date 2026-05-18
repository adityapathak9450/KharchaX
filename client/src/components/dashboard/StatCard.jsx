import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

const colorClasses = {
  blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  red: 'from-red-500/20 to-red-600/20 border-red-500/30',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
}

const iconColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
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
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-6 backdrop-blur-sm`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-white/10 p-3 ${iconColorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">{title}</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(value)}
              </p>
            </div>
          </div>
        </div>

        {/* Change indicator */}
        {change && (
          <div className="flex items-center gap-1 mt-3">
            {isPositive && <ArrowUp className="h-3 w-3 text-green-400" />}
            {isNegative && <ArrowDown className="h-3 w-3 text-red-400" />}
            {isNeutral && <Minus className="h-3 w-3 text-gray-400" />}
            
            <span className={`text-xs font-medium ${
              isPositive ? 'text-green-400' : 
              isNegative ? 'text-red-400' : 
              'text-gray-400'
            }`}>
              {isPositive && '+'}
              {changeValue.toFixed(1)}%
              <span className="text-gray-500 ml-1">
                {change?.period || 'vs last period'}
              </span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
