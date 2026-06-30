import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '../../utils/format'

export function SettlementModal({
  onClose,
  onSubmit,
  isLoading,
  suggestion,
  wallets,
}) {
  const [fromWallet, setFromWallet] = useState(wallets[0]?._id || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      toUser: suggestion.toUserId,
      amount: Number(suggestion.amount),
      fromWallet,
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md dropdown-panel shadow-dropdown overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Record Settlement</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-hover text-muted hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-surface border border-border shadow-sm text-sm text-muted">
              You pay{' '}
              <span className="text-foreground font-semibold">{suggestion.to}</span>{' '}
              <span className="text-green-400 font-semibold">
                {formatCurrency(suggestion.amount)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Pay From Your Wallet
              </label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
                className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground"
                required
              >
                <option className="bg-surface text-foreground" value="">
                  Select wallet
                </option>
                {wallets.map((wallet) => (
                  <option
                    className="bg-surface text-foreground"
                    key={wallet._id}
                    value={wallet._id}
                  >
                    {wallet.name} — {formatCurrency(wallet.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-border shadow-sm text-foreground text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !fromWallet}
                className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {isLoading ? 'Settling...' : 'Confirm Settlement'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
