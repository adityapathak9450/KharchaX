import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '../../utils/format.js'

const categoryIcons = {
  food: '🍔',
  travel: '✈️',
  shopping: '🛍️',
  salary: '💰',
  bills: '📄',
  entertainment: '🎬',
  healthcare: '🏥',
  transfer: '🔄',
}

export function RecentTransactions({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="text-center py-8">
        <div className="text-muted mb-2">No transactions yet</div>
        <p className="text-sm text-muted">Start adding transactions to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => (
        <motion.div
          key={`recent-${transaction._id}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-hover transition-colors group"
        >
          {/* Left side - Icon and details */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
              style={{ 
                backgroundColor: transaction.category?.color ? `${transaction.category.color}20` : 'rgb(var(--color-hover))',
                color: transaction.category?.color || 'rgb(var(--color-muted))'
              }}
            >
              {categoryIcons[transaction.category?.name] || categoryIcons.transfer}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">
                  {transaction.notes || transaction.category?.name || 'Transaction'}
                </p>
                {transaction.tags?.includes('transfer') && (
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                    Transfer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{transaction.category?.name || 'Uncategorized'}</span>
                <span>•</span>
                <span>{formatRelativeTime(transaction.date)}</span>
              </div>
            </div>
          </div>

          {/* Right side - Amount and actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-400' : 'text-foreground'
              }`}>
                {transaction.type === 'income' && '+'}
                {formatCurrency(transaction.amount)}
              </p>
              <div className="flex items-center gap-1 justify-end text-xs text-muted">
                {transaction.wallet?.name || 'Wallet'}
                {transaction.type === 'income' && <ArrowUpRight className="h-3 w-3 text-green-400" />}
                {transaction.type === 'expense' && <ArrowDownRight className="h-3 w-3 text-red-400" />}
              </div>
            </div>
            
            <button className="p-1 rounded-lg text-muted opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-hover transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
