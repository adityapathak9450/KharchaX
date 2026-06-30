import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../lib/apiClient.js'

const walletTypes = [
  { value: 'bank', label: 'Bank Account', icon: '🏦', description: 'Checking, savings, or other bank accounts' },
  { value: 'cash', label: 'Cash', icon: '💵', description: 'Physical cash and hand money' },
  { value: 'upi', label: 'UPI', icon: '📱', description: 'UPI apps like Paytm, PhonePe, GPay' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Business or work-related accounts' },
  { value: 'shared', label: 'Shared', icon: '👥', description: 'Shared wallets with family/friends' }
]

import { PALETTE_COLORS as colors, DEFAULT_ACCENT } from '../../lib/designTokens.js'

const createWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(120, 'Wallet name is too long'),
  type: z.enum(['bank', 'cash', 'upi', 'business', 'shared']),
  balance: z.number().min(0, 'Balance cannot be negative').default(0),
  color: z.string().default(DEFAULT_ACCENT),
  icon: z.string().default('wallet'),
  description: z.string().max(2000, 'Description is too long').optional()
})

export function CreateWalletModal({ onClose, onSuccess }) {
  const [selectedType, setSelectedType] = useState('')
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(createWalletSchema),
    defaultValues: {
      name: '',
      type: '',
      balance: 0,
      color: DEFAULT_ACCENT,
      icon: 'wallet',
      description: ''
    }
  })

  const selectedColor = watch('color')

  const createWalletMutation = useMutation({
    mutationFn: (data) => apiClient.post('/wallets', data),
    onSuccess: () => {
      toast.success('Wallet created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create wallet')
    }
  })

  const onSubmit = (data) => {
    createWalletMutation.mutate(data)
  }

  const handleTypeSelect = (type) => {
    setSelectedType(type.value)
    setValue('type', type.value)
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
          className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-dropdown max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/15 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create New Wallet</h2>
                <p className="text-sm text-muted">Add a new wallet to track your money</p>
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
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Wallet Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Wallet Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {walletTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-hover hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{type.label}</p>
                        <p className="text-xs text-muted">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-400">{errors.type.message}</p>
              )}
            </div>

            {/* Wallet Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Wallet Name</label>
              <input
                type="text"
                placeholder="e.g., HDFC Savings, Paytm Wallet, Cash in Hand"
                {...register('name')}
                className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Initial Balance */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Initial Balance (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                {...register('balance', { valueAsNumber: true })}
                className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50"
              />
              {errors.balance && (
                <p className="mt-2 text-sm text-red-400">{errors.balance.message}</p>
              )}
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Wallet Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-10 h-10 rounded-xl border-2 transition-all ${
                      selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</label>
              <textarea
                placeholder="Add notes about this wallet..."
                rows={3}
                {...register('description')}
                className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
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
                disabled={createWalletMutation.isLoading}
                className="btn-primary flex-1 px-4 py-3 rounded-xl disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none"
              >
                {createWalletMutation.isLoading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
