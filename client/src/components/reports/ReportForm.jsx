import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Calendar, Tag, Wallet as WalletIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'

export function ReportForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    format: 'pdf',
    walletId: '',
    categoryId: ''
  })

  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/reports/generate', data),
    onSuccess: (res) => {
      toast.success('Report generation started')
      onSubmit()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate report')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Generate Report</h2>
            </div>
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
              <label className="block text-sm font-medium text-muted mb-2">Report Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all appearance-none cursor-pointer"
                required
              >
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
                <option value="wallet">Wallet Report</option>
                <option value="category">Category Report</option>
                <option value="budget">Budget Report</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Month</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all appearance-none cursor-pointer"
                    disabled={formData.type === 'yearly'}
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all appearance-none cursor-pointer"
                    required
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all appearance-none cursor-pointer"
                required
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
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
                disabled={mutation.isPending}
                className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {mutation.isPending ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
