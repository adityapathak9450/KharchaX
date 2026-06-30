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
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm({
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
    const data = getValues()
    transferMutation.mutate({
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      amount: Number(data.amount),
      notes: data.notes || undefined
    })
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
          className="absolute inset-0 bg-overlay/80"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-dropdown"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/15 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Transfer Funds</h2>
                <p className="text-sm text-muted">Move money between wallets</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          {!showConfirmation ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* From Wallet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">From Wallet</label>
                <select
                  {...register('fromWalletId')}
                  className="w-full px-4 py-3 input-field rounded-xl focus:outline-none focus:border-primary/50"
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
                  className="p-2 rounded-lg bg-elevated text-muted hover:text-foreground hover:bg-elevated transition-colors"
                  disabled={!watchedValues.fromWalletId || !watchedValues.toWalletId}
                >
                  <ArrowDownRight className="h-5 w-5 rotate-180" />
                </button>
              </div>

              {/* To Wallet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">To Wallet</label>
                <select
                  {...register('toWalletId')}
                  className="w-full px-4 py-3 input-field rounded-xl focus:outline-none focus:border-primary/50"
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
                <label className="block text-sm font-medium text-foreground mb-2">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50"
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
                <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
                <textarea
                  placeholder="Add a note for this transfer..."
                  rows={3}
                  {...register('notes')}
                  className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none"
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
                  className="btn-secondary flex-1 px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFromWallet || !selectedToWallet || !watchedValues.amount || watchedValues.amount > selectedFromWallet.balance}
                  className="btn-primary flex-1 px-4 py-3 rounded-xl disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none"
                >
                  Review Transfer
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation Screen */
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Transfer</h3>
                <p className="text-sm text-muted">Please review the transfer details</p>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-hover rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{walletIcons[selectedFromWallet?.type] || '💳'}</span>
                    <div>
                      <p className="font-medium text-foreground">{selectedFromWallet?.name}</p>
                      <p className="text-sm text-muted">From</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted">Available</p>
                    <p className="font-medium text-foreground">{formatCurrency(selectedFromWallet?.balance)}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <ArrowDownRight className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-hover rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{walletIcons[selectedToWallet?.type] || '💳'}</span>
                    <div>
                      <p className="font-medium text-foreground">{selectedToWallet?.name}</p>
                      <p className="text-sm text-muted">To</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted">Current Balance</p>
                    <p className="font-medium text-foreground">{formatCurrency(selectedToWallet?.balance)}</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">Transfer Amount</span>
                    <span className="text-xl font-bold text-foreground">{formatCurrency(watchedValues.amount)}</span>
                  </div>
                </div>

                {watchedValues.notes && (
                  <div className="p-3 bg-hover rounded-xl">
                    <p className="text-sm text-muted mb-1">Notes</p>
                    <p className="text-foreground">{watchedValues.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="btn-secondary flex-1 px-4 py-3 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={confirmTransfer}
                  disabled={transferMutation.isPending}
                  className="btn-primary flex-1 px-4 py-3 rounded-xl disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none"
                >
                  {transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
