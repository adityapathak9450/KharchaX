import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Wallet, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import { ChevronDown, Check } from 'lucide-react'

export function TransactionFilters({ filters, categories, wallets, onFilterChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [openDropdown, setOpenDropdown] = useState(null)

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateRangeChange = (value) => {
    let newFilters = { ...localFilters, dateRange: value }
    
    // Set specific dates based on preset
    if (value !== 'custom') {
      newFilters.startDate = ''
      newFilters.endDate = ''
    }
    
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      type: '',
      category: '',
      wallet: '',
      dateRange: '30d',
      startDate: '',
      endDate: ''
    }
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(v => v && v !== '30d')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="card border-border rounded-2xl p-6 space-y-6"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Transaction Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filter-type"
                  checked={localFilters.type === ''}
                  onChange={() => handleFilterChange('type', '')}
                  className="text-primary bg-elevated border-border focus:ring-ring/50"
                />
                <span className="text-sm text-muted">All Types</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filter-type"
                  checked={localFilters.type === 'income'}
                  onChange={() => handleFilterChange('type', 'income')}
                  className="text-primary bg-elevated border-border focus:ring-ring/50"
                />
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-muted">Income</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filter-type"
                  checked={localFilters.type === 'expense'}
                  onChange={() => handleFilterChange('type', 'expense')}
                  className="text-primary bg-elevated border-border focus:ring-ring/50"
                />
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-muted">Expense</span>
                </div>
              </label>
            </div>
          </div>

        {/* Category */}
<div>
  <label className="block text-sm font-medium text-foreground mb-3">
    Category
  </label>

  <div className="relative">
    <select
      value={localFilters.category}
      onChange={(e) =>
        handleFilterChange('category', e.target.value)
      }
      className="
        w-full
        appearance-none
        px-4 py-3
        bg-surface
        border border-border
        rounded-xl
        text-sm text-foreground
        focus:outline-none
        focus:border-primary/50
        transition-all
        cursor-pointer
      "
    >
      <option value="" className="bg-surface text-foreground">
        All Categories
      </option>

      {categories.map((category) => (
        <option
          key={category._id}
          value={category._id}
          className="bg-surface text-foreground"
        >
          {category.name}
        </option>
      ))}
    </select>

    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
      ▼
    </div>
  </div>
</div>

{/* Wallet */}
<div>
  <label className="block text-sm font-medium text-foreground mb-3">
    Wallet
  </label>

  <div className="relative">
    <select
      value={localFilters.wallet}
      onChange={(e) =>
        handleFilterChange('wallet', e.target.value)
      }
      className="
        w-full
        appearance-none
        px-4 py-3
        bg-surface
        border border-border
        rounded-xl
        text-sm text-foreground
        focus:outline-none
        focus:border-primary/50
        transition-all
        cursor-pointer
      "
    >
      <option value="" className="bg-surface text-foreground">
        All Wallets
      </option>

      {wallets.map((wallet) => (
        <option
          key={wallet._id}
          value={wallet._id}
          className="bg-surface text-foreground"
        >
          {wallet.name}
        </option>
      ))}
    </select>

    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
      ▼
    </div>
  </div>
</div>
</div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Date Range</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === '7d'}
                onChange={() => handleDateRangeChange('7d')}
                className="text-primary bg-elevated border-border focus:ring-ring/50"
              />
              <span className="text-sm text-muted">Last 7 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === '30d'}
                onChange={() => handleDateRangeChange('30d')}
                className="text-primary bg-elevated border-border focus:ring-ring/50"
              />
              <span className="text-sm text-muted">Last 30 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === '90d'}
                onChange={() => handleDateRangeChange('90d')}
                className="text-primary bg-elevated border-border focus:ring-ring/50"
              />
              <span className="text-sm text-muted">Last 90 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === 'custom'}
                onChange={() => handleDateRangeChange('custom')}
                className="text-primary bg-elevated border-border focus:ring-ring/50"
              />
              <span className="text-sm text-muted">Custom</span>
            </label>
          </div>

          {/* Custom Date Range */}
          {localFilters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                <input
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {localFilters.type && (
                <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm flex items-center gap-2">
                  {localFilters.type === 'income' ? 'Income' : 'Expense'}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.category && (
                <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm flex items-center gap-2">
                  {categories.find(c => c._id === localFilters.category)?.name || 'Category'}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.wallet && (
                <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm flex items-center gap-2">
                  {wallets.find(w => w._id === localFilters.wallet)?.name || 'Wallet'}
                  <button
                    onClick={() => handleFilterChange('wallet', '')}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.dateRange !== '30d' && (
                <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm flex items-center gap-2">
                  {localFilters.dateRange === '7d' && 'Last 7 days'}
                  {localFilters.dateRange === '30d' && 'Last 30 days'}
                  {localFilters.dateRange === '90d' && 'Last 90 days'}
                  {localFilters.dateRange === 'custom' && 'Custom range'}
                  <button
                    onClick={() => handleDateRangeChange('30d')}
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
