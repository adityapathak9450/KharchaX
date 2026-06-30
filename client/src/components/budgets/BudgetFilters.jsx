import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Target, AlertTriangle, TrendingUp } from 'lucide-react'

export function BudgetFilters({ filters, categories, onFilterChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const currentDate = new Date()
    const clearedFilters = {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      category: '',
      status: 'all'
    }
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(v => v && v !== 'all')

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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-surface/50 border border-border rounded-2xl p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Month</label>
            <select
              value={localFilters.month}
              onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
              className="w-full px-3 py-2 input-field rounded-lg text-sm"
            >
              {months.map((month) => (
                <option className="bg-surface text-foreground" key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Year</label>
            <select
              value={localFilters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
              className="w-full px-3 py-2 input-field rounded-lg text-sm"
            >
              {years.map((year) => (
                <option className="bg-surface text-foreground" key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Category</label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 input-field rounded-lg text-sm"
            >
              <option className="bg-surface text-foreground" value="">All Categories</option>
              {categories.map((category) => (
                <option className="bg-surface text-foreground" key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Status</label>
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 input-field rounded-lg text-sm"
            >
              <option className="bg-surface text-foreground" value="all">All Status</option>
              <option className="bg-surface text-foreground" value="on-track">On Track</option>
              <option className="bg-surface text-foreground" value="alerting">Alerting</option>
              <option className="bg-surface text-foreground" value="exceeded">Exceeded</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {localFilters.month && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {months.find(m => m.value === localFilters.month)?.label}
                  <button
                    onClick={() => handleFilterChange('month', new Date().getMonth() + 1)}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.year && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                  {localFilters.year}
                  <button
                    onClick={() => handleFilterChange('year', new Date().getFullYear())}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.category && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  {categories.find(c => c._id === localFilters.category)?.name || 'Category'}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.status && localFilters.status !== 'all' && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                  {localFilters.status === 'on-track' && <TrendingUp className="h-3 w-3" />}
                  {localFilters.status === 'alerting' && <AlertTriangle className="h-3 w-3" />}
                  {localFilters.status === 'exceeded' && <AlertTriangle className="h-3 w-3" />}
                  {localFilters.status.charAt(0).toUpperCase() + localFilters.status.slice(1).replace('-', ' ')}
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
