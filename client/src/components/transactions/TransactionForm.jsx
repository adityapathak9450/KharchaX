import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, ArrowDownRight, Calendar, Wallet, Tag, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../lib/apiClient.js'
import { formatCurrency } from '../../utils/format.js'

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  wallet: z.string().min(1, 'Wallet is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(4000, 'Notes are too long').optional(),
  tags: z.array(z.string().max(40, 'Tag is too long')).max(10, 'Too many tags').optional()
})

export function TransactionForm({ transaction, categories, wallets, onClose, onSuccess }) {
  const [newTag, setNewTag] = useState('')
  const queryClient = useQueryClient()
  const isEditing = !!transaction

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction?.amount || '',
      type: transaction?.type || 'expense',
      category: transaction?.category?._id || '',
      wallet: transaction?.wallet?._id || '',
      date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: transaction?.notes || '',
      tags: transaction?.tags || []
    }
  })

  const watchedTags = watch('tags') || []
  const watchedType = watch('type')

  const createTransactionMutation = useMutation({
    mutationFn: (data) => apiClient.post('/transactions', data),
    onSuccess: () => {
      toast.success('Transaction created successfully')
      onSuccess()
      onClose()
      reset()
      // Invalidate all related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-trend'] })
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create transaction')
    }
  })

  const updateTransactionMutation = useMutation({
    mutationFn: (data) => apiClient.put(`/transactions/${transaction._id}`, data),
    onSuccess: () => {
      toast.success('Transaction updated successfully')
      onSuccess()
      onClose()
      reset()
      // Invalidate all related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-trend'] })
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update transaction')
    }
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: () => apiClient.delete(`/transactions/${transaction._id}`),
    onSuccess: () => {
      toast.success('Transaction deleted successfully')
      onSuccess()
      // Invalidate all related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-trend'] })
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete transaction')
    }
  })
const onSubmit = (data) => {
  if (isSubmitting) return;

  const selectedDate = new Date(data.date)
  const now = new Date()

  selectedDate.setHours(
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  )

  const payload = {
    ...data,
    date: selectedDate.toISOString(),
    tags: data.tags || []
  }

  console.log('Transaction Form Submit:', payload);
    
    if (isEditing) {
      updateTransactionMutation.mutate(payload)
    } else {
      createTransactionMutation.mutate(payload)
    }
  }

  const handleAddTag = (e) => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim()) && watchedTags.length < 10) {
      setValue('tags', [...watchedTags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove))
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransactionMutation.mutate()
    }
  }

  const isLoading = createTransactionMutation.isLoading || updateTransactionMutation.isLoading

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
          className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-dropdown max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${watchedType === 'income' ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                {watchedType === 'income' ? (
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                <p className="text-sm text-muted">
                  {isEditing ? 'Update transaction details' : 'Record a new transaction'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={deleteTransactionMutation.isLoading}
                  className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Transaction Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('type', 'income')}
                  className={`p-4 rounded-xl border transition-all ${
                    watchedType === 'income'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border bg-hover hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-green-400" />
                    <span className="font-medium text-foreground">Income</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'expense')}
                  className={`p-4 rounded-xl border transition-all ${
                    watchedType === 'expense'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border bg-hover hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-red-400" />
                    <span className="font-medium text-foreground">Expense</span>
                  </div>
                </button>
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-400">{errors.type.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50 text-lg font-semibold"
                />
              </div>
              {errors.amount && (
                <p className="mt-2 text-sm text-red-400">{errors.amount.message}</p>
              )}
            </div>

            {/* Category and Wallet */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 input-field rounded-xl focus:outline-none focus:border-primary/50"
                >
                  <option className="bg-surface text-foreground" value="">Select category</option>
                  {categories.map((category) => (
                    <option className="bg-surface text-foreground" key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-400">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Wallet</label>
                <select
                  {...register('wallet')}
                  className="w-full px-4 py-3 input-field rounded-xl focus:outline-none focus:border-primary/50"
                >
                  <option className="bg-surface text-foreground" value="">Select wallet</option>
                  {wallets.map((wallet) => (
                    <option className="bg-surface text-foreground" key={wallet._id} value={wallet._id}>
                      {wallet.name} ({formatCurrency(Number(wallet.balance) || 0)})
                    </option>
                  ))}
                </select>
                {errors.wallet && (
                  <p className="mt-2 text-sm text-red-400">{errors.wallet.message}</p>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="date"
                  {...register('date')}
                  className="w-full pl-10 pr-4 py-3 input-field rounded-xl focus:outline-none focus:border-primary/50"
                />
              </div>
              {errors.date && (
                <p className="mt-2 text-sm text-red-400">{errors.date.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
              <textarea
                placeholder="Add notes about this transaction..."
                rows={3}
                {...register('notes')}
                className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none"
              />
              {errors.notes && (
                <p className="mt-2 text-sm text-red-400">{errors.notes.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tags (Optional)</label>
              <div className="space-y-3">
                {/* Add new tag */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag(e)
                      }
                    }}
                    className="flex-1 px-3 py-2 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || watchedTags.length >= 10}
                    className="btn-primary px-3 py-2 disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none text-sm"
                  >
                    Add
                  </button>
                </div>

                {/* Existing tags */}
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-primary hover:text-primary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {errors.tags && (
                <p className="mt-2 text-sm text-red-400">{errors.tags.message}</p>
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
                disabled={isLoading || isSubmitting}
                className="btn-primary flex-1 px-4 py-3 rounded-xl disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none"
              >
                {isLoading || isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Add Transaction')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
