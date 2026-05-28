import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency } from '../../utils/format'

export function SharedExpenseForm({
  onClose,
  onSubmit,
  members,
  wallets = [],
  isLoading,
}) {
  const { user } = useAuthStore()
  const currentUserId = user?._id || user?.id

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paidBy: currentUserId || '',
    paidFromWallet: '',
    splitType: 'equal',
    splitBetween: members.map((m) => m.userId?._id || m.userId),
    splits: [],
  })

  const [customSplits, setCustomSplits] = useState({})

  useEffect(() => {
    if (currentUserId && !formData.paidBy) {
      setFormData((prev) => ({ ...prev, paidBy: currentUserId }))
    }
  }, [currentUserId, formData.paidBy])

  const isCurrentUserPayer = formData.paidBy === currentUserId

  const payerWallets = useMemo(() => {
    if (!isCurrentUserPayer) return []
    return wallets.filter((w) => !w.isArchived)
  }, [wallets, isCurrentUserPayer])

  useEffect(() => {
    if (isCurrentUserPayer && payerWallets.length > 0 && !formData.paidFromWallet) {
      setFormData((prev) => ({ ...prev, paidFromWallet: payerWallets[0]._id }))
    }
  }, [isCurrentUserPayer, payerWallets, formData.paidFromWallet])

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      amount: Number(formData.amount),
      description: formData.description,
      paidBy: formData.paidBy,
      splitBetween: formData.splitBetween,
      splitType: formData.splitType,
      paidFromWallet: isCurrentUserPayer ? formData.paidFromWallet : undefined,
      splits:
        formData.splitType === 'equal'
          ? []
          : formData.splitBetween.map((memberId) => ({
              userId: memberId,
              amount:
                formData.splitType === 'exact'
                  ? Number(customSplits[memberId]?.amount || 0)
                  : undefined,
              percentage:
                formData.splitType === 'percentage'
                  ? Number(customSplits[memberId]?.percentage || 0)
                  : undefined,
            })),
    }

    onSubmit(payload)
  }

  const toggleMember = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(memberId)
        ? prev.splitBetween.filter((id) => id !== memberId)
        : [...prev.splitBetween, memberId],
    }))
  }

  const updateCustomSplit = (memberId, field, value) => {
    setCustomSplits((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
      },
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
          className="w-full max-w-lg bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Add Shared Expense</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                step="0.01"
                min="0.01"
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
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Dinner, Hotel, Cab..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Paid By</label>
              <select
                value={formData.paidBy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paidBy: e.target.value,
                    paidFromWallet: '',
                  })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                required
              >
                <option className="bg-gray-900 text-white" value="">
                  Select who paid
                </option>
                {members.map((member) => {
                  const memberId = member.userId?._id || member.userId
                  return (
                    <option
                      className="bg-gray-900 text-white"
                      key={memberId}
                      value={memberId}
                    >
                      {member.userId?.name || 'Unknown'}
                    </option>
                  )
                })}
              </select>
            </div>

            {isCurrentUserPayer ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Paid From Wallet
                </label>
                {payerWallets.length === 0 ? (
                  <p className="text-sm text-amber-400">
                    No wallets found. Create a wallet first to record payment.
                  </p>
                ) : (
                  <select
                    value={formData.paidFromWallet}
                    onChange={(e) =>
                      setFormData({ ...formData, paidFromWallet: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                    required
                  >
                    <option className="bg-gray-900 text-white" value="">
                      Select wallet
                    </option>
                    {payerWallets.map((wallet) => (
                      <option
                        className="bg-gray-900 text-white"
                        key={wallet._id}
                        value={wallet._id}
                      >
                        {wallet.name} — {formatCurrency(Number(wallet.balance) || 0)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Wallet balance is deducted only when you are the payer.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Split Type
              </label>
              <select
                value={formData.splitType}
                onChange={(e) =>
                  setFormData({ ...formData, splitType: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
              >
                <option className="bg-gray-900 text-white" value="equal">
                  Equal split
                </option>
                <option className="bg-gray-900 text-white" value="percentage">
                  Percentage split
                </option>
                <option className="bg-gray-900 text-white" value="exact">
                  Exact amounts
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Split Between
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => {
                  const memberId = member.userId?._id || member.userId
                  const isSelected = formData.splitBetween.includes(memberId)

                  return (
                    <div key={memberId} className="space-y-2">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-500/10 border border-indigo-500/30'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(memberId)}
                        />
                        <span className="text-sm text-white">
                          {member.userId?.name || 'Unknown'}
                        </span>
                      </label>

                      {isSelected && formData.splitType === 'percentage' && (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="% share"
                          value={customSplits[memberId]?.percentage || ''}
                          onChange={(e) =>
                            updateCustomSplit(memberId, 'percentage', e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                        />
                      )}

                      {isSelected && formData.splitType === 'exact' && (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={customSplits[memberId]?.amount || ''}
                          onChange={(e) =>
                            updateCustomSplit(memberId, 'amount', e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
                        />
                      )}
                    </div>
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
                disabled={
                  isLoading ||
                  (isCurrentUserPayer && (!formData.paidFromWallet || payerWallets.length === 0))
                }
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
