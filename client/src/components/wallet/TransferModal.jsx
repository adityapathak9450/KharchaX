import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, DollarSign } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'

export function TransferModal({ onClose, fromWalletId, onSuccess }) {
  const [formData, setFormData] = useState({
    toWalletId: '',
    amount: '',
    notes: ''
  })

  const queryClient = useQueryClient()

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.get('/wallets').then(res => res.data.data.wallets),
  })

  const transferMutation = useMutation({
    mutationFn: (data) => apiClient.post('/wallets/transfer', data),
    onSuccess: () => {
      toast.success('Transfer completed successfully')
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', fromWalletId] })
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Transfer failed')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    transferMutation.mutate({
      fromWalletId,
      toWalletId: formData.toWalletId,
      amount: parseFloat(formData.amount),
      notes: formData.notes
    })
  }

  const availableWallets = wallets?.filter(w => w._id !== fromWalletId) || []

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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Transfer Funds</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-hover text-muted hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">To Wallet</label>
              <select
                value={formData.toWalletId}
                onChange={(e) => setFormData({ ...formData, toWalletId: e.target.value })}
                className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all appearance-none cursor-pointer"
                required
              >
                <option value="">Select destination wallet</option>
                {availableWallets.map((wallet) => (
                  <option key={wallet._id} value={wallet._id}>
                    {wallet.name} - ₹{wallet.balance.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">Notes (Optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Transfer notes"
                className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-border shadow-sm text-foreground text-sm font-medium hover:bg-hover transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
