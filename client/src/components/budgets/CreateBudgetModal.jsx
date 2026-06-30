import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Calendar, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../lib/apiClient.js'
import { formatCurrency } from '../../utils/format.js'

import { PALETTE_COLORS as colors, DEFAULT_ACCENT } from '../../lib/designTokens.js'

const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(120, 'Budget name is too long'),
  amount: z.number().min(0.01, 'Budget amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  month: z.number().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.number().min(1970, 'Invalid year').max(2100, 'Invalid year'),
  alertAt: z.number().min(1, 'Alert threshold must be at least 1%').max(100, 'Alert threshold cannot exceed 100%').default(80),
  color: z.string().default(DEFAULT_ACCENT)
})

export function CreateBudgetModal({ categories, onClose, onSuccess }) {
  const currentDate = new Date()
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: '',
      amount: '',
      category: '',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      alertAt: 80,
      color: DEFAULT_ACCENT
    }
  })

  const selectedColor = watch('color')
  const selectedCategory = watch('category')
  const selectedAmount = watch('amount')

  const createBudgetMutation = useMutation({
    mutationFn: (data) => apiClient.post('/budgets', data),
    onSuccess: () => {
      toast.success('Budget created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create budget')
    }
  })

  const onSubmit = (data) => {
    createBudgetMutation.mutate(data)
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() + i)

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
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create New Budget</h2>
                <p className="text-sm text-muted">Set spending limits for better financial control</p>
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
            {/* Budget Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget Name</label>
              <input
                type="text"
                placeholder="e.g., Monthly Food Budget, Shopping Limit"
                {...register('name')}
                className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50"
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

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget Amount (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted">
                  {selectedAmount && formatCurrency(selectedAmount).replace('₹', '')}
                </div>
              </div>
              {errors.amount && (
                <p className="mt-2 text-sm text-red-400">{errors.amount.message}</p>
              )}
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Month</label>
                <select
                  {...register('month', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50"
                >
                  {months.map((month) => (
                    <option className="bg-surface text-foreground" key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="mt-2 text-sm text-red-400">{errors.month.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                <select
                  {...register('year', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50"
                >
                  {years.map((year) => (
                    <option className="bg-surface text-foreground" key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="mt-2 text-sm text-red-400">{errors.year.message}</p>
                )}
              </div>
            </div>

            {/* Alert Threshold */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Alert Threshold (%)
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="100"
                  {...register('alertAt', { valueAsNumber: true })}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Alert when budget reaches</span>
                  <span className="text-foreground font-medium">{watch('alertAt')}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 70, 80, 90].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('alertAt', value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        watch('alertAt') === value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface/50 text-muted hover:text-foreground'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>
              {errors.alertAt && (
                <p className="mt-2 text-sm text-red-400">{errors.alertAt.message}</p>
              )}
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Budget Color</label>
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

            {/* Preview */}
            {selectedCategory && selectedAmount && (
              <div className="p-4 bg-surface/50 rounded-xl border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">Budget Preview</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <span className="text-sm text-muted">
                      {categories.find(c => c._id === selectedCategory)?.name || 'Category'}
                    </span>
                  </div>
                  <span className="text-sm text-foreground font-medium">
                    {formatCurrency(selectedAmount)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted">
                  Alert at {formatCurrency(selectedAmount * (watch('alertAt') / 100))}
                </div>
              </div>
            )}

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
                disabled={createBudgetMutation.isLoading}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none"
              >
                {createBudgetMutation.isLoading ? 'Creating...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
