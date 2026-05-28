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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Record Settlement</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
              You pay{' '}
              <span className="text-white font-semibold">{suggestion.to}</span>{' '}
              <span className="text-green-400 font-semibold">
                {formatCurrency(suggestion.amount)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pay From Your Wallet
              </label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              >
                <option className="bg-gray-900 text-white" value="">
                  Select wallet
                </option>
                {wallets.map((wallet) => (
                  <option
                    className="bg-gray-900 text-white"
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !fromWallet}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm disabled:opacity-50"
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
