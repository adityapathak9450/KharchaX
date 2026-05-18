import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../lib/apiClient.js'
import { formatCurrency } from '../../utils/format.js'

const walletIcons = {
  bank: '🏦',
  cash: '💵',
  upi: '📱',
  business: '💼',
  shared: '👥',
}

const transferSchema = z.object({
  fromWalletId: z.string().min(1, 'Source wallet is required'),
  toWalletId: z.string().min(1, 'Destination wallet is required'),
  amount: z.number().min(0.01, 'Transfer amount must be greater than zero'),
  notes: z.string().max(4000, 'Notes are too long').optional()
}).refine((data) => data.fromWalletId !== data.toWalletId, {
  message: 'Source and destination wallets must be different',
  path: ['toWalletId']
})

export function TransferModal({ wallets, onClose, onSuccess }) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWalletId: '',
      toWalletId: '',
      amount: '',
      notes: ''
    }
  })

  const watchedValues = watch()
  const selectedFromWallet = wallets.find(w => w._id === watchedValues.fromWalletId)
  const selectedToWallet = wallets.find(w => w._id === watchedValues.toWalletId)

  const transferMutation = useMutation({
    mutationFn: (data) => apiClient.post('/wallets/transfer', data),
    onSuccess: () => {
      toast.success('Transfer completed successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Transfer failed')
    }
  })

  const onSubmit = (data) => {
    if (data.amount > selectedFromWallet.balance) {
      toast.error('Insufficient balance in source wallet')
      return
    }
    setShowConfirmation(true)
  }

  const confirmTransfer = () => {
    const data = watchedValues
    transferMutation.mutate(data)
  }

  const handleSwapWallets = () => {
    const fromId = watchedValues.fromWalletId
    const toId = watchedValues.toWalletId
    setValue('fromWalletId', toId)
    setValue('toWalletId', fromId)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Transfer Funds</h2>
                <p className="text-sm text-gray-400">Move money between wallets</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          {!showConfirmation ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* From Wallet */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">From Wallet</label>
                <select
                  {...register('fromWalletId')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">Select source wallet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet._id} value={wallet._id}>
                      {wallet.name} ({formatCurrency(wallet.balance)})
                    </option>
                  ))}
                </select>
                {errors.fromWalletId && (
                  <p className="mt-2 text-sm text-red-400">{errors.fromWalletId.message}</p>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapWallets}
                  className="p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                  disabled={!watchedValues.fromWalletId || !watchedValues.toWalletId}
                >
                  <ArrowDownRight className="h-5 w-5 rotate-180" />
                </button>
              </div>

              {/* To Wallet */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">To Wallet</label>
                <select
                  {...register('toWalletId')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">Select destination wallet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet._id} value={wallet._id}>
                      {wallet.name} ({formatCurrency(wallet.balance)})
                    </option>
                  ))}
                </select>
                {errors.toWalletId && (
                  <p className="mt-2 text-sm text-red-400">{errors.toWalletId.message}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
                {errors.amount && (
                  <p className="mt-2 text-sm text-red-400">{errors.amount.message}</p>
                )}
                {selectedFromWallet && watchedValues.amount > selectedFromWallet.balance && (
                  <p className="mt-2 text-sm text-red-400">
                    Insufficient balance. Available: {formatCurrency(selectedFromWallet.balance)}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Notes (Optional)</label>
                <textarea
                  placeholder="Add a note for this transfer..."
                  rows={3}
                  {...register('notes')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
                {errors.notes && (
                  <p className="mt-2 text-sm text-red-400">{errors.notes.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFromWallet || !selectedToWallet || !watchedValues.amount || watchedValues.amount > selectedFromWallet.balance}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Transfer
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation Screen */
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Confirm Transfer</h3>
                <p className="text-sm text-gray-400">Please review the transfer details</p>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{walletIcons[selectedFromWallet?.type] || '💳'}</span>
                    <div>
                      <p className="font-medium text-white">{selectedFromWallet?.name}</p>
                      <p className="text-sm text-gray-400">From</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Available</p>
                    <p className="font-medium text-white">{formatCurrency(selectedFromWallet?.balance)}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 bg-indigo-600/20 rounded-lg">
                    <ArrowDownRight className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{walletIcons[selectedToWallet?.type] || '💳'}</span>
                    <div>
                      <p className="font-medium text-white">{selectedToWallet?.name}</p>
                      <p className="text-sm text-gray-400">To</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Current Balance</p>
                    <p className="font-medium text-white">{formatCurrency(selectedToWallet?.balance)}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-400">Transfer Amount</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(watchedValues.amount)}</span>
                  </div>
                </div>

                {watchedValues.notes && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Notes</p>
                    <p className="text-white">{watchedValues.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={confirmTransfer}
                  disabled={transferMutation.isLoading}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transferMutation.isLoading ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
