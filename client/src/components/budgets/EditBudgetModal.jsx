import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../lib/apiClient.js'
import { formatCurrency } from '../../utils/format.js'

import { PALETTE_COLORS as colors, DEFAULT_ACCENT } from '../../lib/designTokens.js'

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

const editBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(120, 'Budget name is too long'),
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  month: z.number().min(1).max(12),
  year: z.number().min(1970).max(2100),
  alertAt: z.number().min(1).max(100),
  color: z.string().default(DEFAULT_ACCENT),
})

export function EditBudgetModal({ budget, categories, onClose, onSuccess }) {
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(editBudgetSchema),
    defaultValues: {
      name: '',
      amount: 0,
      category: '',
      month: new Date().getMonth() + 1,
      year: currentYear,
      alertAt: 80,
      color: DEFAULT_ACCENT,
    },
  })

  // Pre-fill form when budget prop arrives
  useEffect(() => {
    if (budget) {
      reset({
        name: budget.name,
        amount: budget.amount,
        category: budget.category?._id || budget.category,
        month: budget.month,
        year: budget.year,
        alertAt: budget.alertAt ?? 80,
        color: budget.color || DEFAULT_ACCENT,
      })
    }
  }, [budget, reset])

  const selectedColor = watch('color')
  const selectedCategory = watch('category')
  const selectedAmount = watch('amount')
  const alertAt = watch('alertAt')

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.put(`/budgets/${budget._id}`, data),
    onSuccess: () => {
      toast.success('Budget updated successfully')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update budget')
    },
  })

  const onSubmit = (data) => updateMutation.mutate(data)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-overlay/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-dropdown max-h-[90vh] overflow-y-auto"
        >
          {/* Colored top accent matching budget color */}
          <div
            className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: selectedColor }}
          />

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border mt-1">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${selectedColor}25` }}
              >
                <Pencil className="h-5 w-5" style={{ color: selectedColor }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Edit Budget</h2>
                <p className="text-sm text-muted">
                  Updating: <span className="text-foreground font-medium">{budget?.name}</span>
                </p>
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
                placeholder="e.g., Monthly Food Budget"
                {...register('name')}
                className="w-full px-4 py-3 input-field rounded-xl placeholder:text-muted transition-colors"
              />
              {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option className="bg-surface text-foreground" value="">Select category</option>
                {categories.map((cat) => (
                  <option className="bg-surface text-foreground" key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-2 text-sm text-red-400">{errors.category.message}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-8 pr-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              {errors.amount && <p className="mt-2 text-sm text-red-400">{errors.amount.message}</p>}
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Month</label>
                <select
                  {...register('month', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {months.map((m) => (
                    <option className="bg-surface text-foreground" key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                <select
                  {...register('year', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {years.map((y) => (
                    <option className="bg-surface text-foreground" key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alert Threshold */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Alert Threshold</label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="100"
                  {...register('alertAt', { valueAsNumber: true })}
                  className="w-full accent-primary"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Alert when budget reaches</span>
                  <span className="text-foreground font-semibold">{alertAt}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 70, 80, 90].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue('alertAt', val)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        alertAt === val
                          ? 'bg-primary text-primary-foreground scale-105'
                          : 'bg-surface/50 text-muted hover:text-foreground hover:bg-surface/75'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Budget Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-10 h-10 rounded-xl border-2 transition-all duration-150 ${
                      selectedColor === color ? 'border-foreground scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Live Preview */}
            {selectedCategory && selectedAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-surface/50 rounded-xl border border-border"
              >
                <h4 className="text-sm font-medium text-muted mb-3">Live Preview</h4>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedColor }} />
                    <span className="text-sm text-foreground">
                      {categories.find((c) => c._id === selectedCategory)?.name || 'Category'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(selectedAmount)}</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(((budget?.spent || 0) / selectedAmount) * 100, 100)}%`,
                      backgroundColor: selectedColor,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted">
                  <span>Spent: {formatCurrency(budget?.spent || 0)}</span>
                  <span>Alert at {formatCurrency(selectedAmount * (alertAt / 100))}</span>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 px-4 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-3 text-foreground rounded-xl transition-all font-medium disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none hover:brightness-110 active:scale-[0.99]"
                style={{ backgroundColor: selectedColor }}
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
