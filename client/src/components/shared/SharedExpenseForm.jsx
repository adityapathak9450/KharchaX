import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Users } from 'lucide-react'

export function SharedExpenseForm({
  onClose,
  onSubmit,
  members,
  wallets
}) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paidBy: '',
    paidFromWallet: '',
    splitBetween: members.map(
      (m) => m.userId?._id || m.userId
    )
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const toggleMember = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(memberId)
        ? prev.splitBetween.filter((id) => id !== memberId)
        : [...prev.splitBetween, memberId]
    }))
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
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>

              <h2 className="text-lg font-semibold text-white">
                Add Shared Expense
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>

              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value
                  })
                }
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>

              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value
                  })
                }
                placeholder="Dinner, Hotel, Cab..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paid By
              </label>

              <select
                value={formData.paidBy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paidBy: e.target.value
                  })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              >
                <option value="">Select who paid</option>

                {members.map((member) => (
                  <option
                    key={member.userId?._id || member.userId}
                    value={member.userId?._id || member.userId}
                  >
                    {member.userId?.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paid From Wallet
              </label>

              <select
                value={formData.paidFromWallet}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paidFromWallet: e.target.value
                  })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              >
                <option value="">
                  Select wallet
                </option>

                {wallets.map((wallet) => (
                  <option
                    key={wallet._id}
                    value={wallet._id}
                  >
                    {wallet.name} — ₹{wallet.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Split Between
              </label>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => {
                  const memberId =
                    member.userId?._id || member.userId

                  const isSelected =
                    formData.splitBetween.includes(memberId)

                  return (
                    <label
                      key={memberId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-500/10 border border-indigo-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleMember(memberId)
                        }
                      />

                      <span className="text-sm text-white">
                        {member.userId?.name || 'Unknown'}
                      </span>
                    </label>
                  )
                })}
              </div>
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm"
              >
                Add Expense
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}