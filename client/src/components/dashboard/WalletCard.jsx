import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Wallet, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

const walletIcons = {
  bank: '🏦',
  cash: '💵',
  upi: '📱',
  business: '💼',
  shared: '👥',
}

export function WalletCard({ wallet }) {
  const balanceChange = wallet.balanceChange || 0
  const isPositive = balanceChange > 0
  const isNegative = balanceChange < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="card-interactive p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
            style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
          >
            {walletIcons[wallet.type] || walletIcons.bank}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{wallet.name}</h4>
            <p className="text-xs text-muted capitalize">{wallet.type}</p>
          </div>
        </div>
        <button className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-foreground">
          {formatCurrency(wallet.balance)}
        </p>
        {balanceChange !== 0 && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive && <ArrowUpRight className="h-3 w-3 text-green-400" />}
            {isNegative && <ArrowDownRight className="h-3 w-3 text-red-400" />}
            <span className={`text-xs font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive && '+'}
              {formatCurrency(Math.abs(balanceChange))} this month
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Wallet className="h-3 w-3 text-muted" />
          <span className="text-xs text-muted">
            {wallet.transactionCount || 0} transactions
          </span>
        </div>
        <span className="text-xs text-muted">
          {wallet.currency || 'INR'}
        </span>
      </div>

      {/* Accent border */}
      <div 
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ backgroundColor: wallet.color }}
      />
    </motion.div>
  )
}
