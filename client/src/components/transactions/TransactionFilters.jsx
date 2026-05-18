import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Wallet, Tag, TrendingUp, TrendingDown } from 'lucide-react'

export function TransactionFilters({ filters, categories, wallets, onFilterChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters)

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
        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Transaction Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filter-type"
                  checked={localFilters.type === ''}
                  onChange={() => handleFilterChange('type', '')}
                  className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
                />
                <span className="text-sm text-gray-300">All Types</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filter-type"
                  checked={localFilters.type === 'income'}
                  onChange={() => handleFilterChange('type', 'income')}
                  className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
                />
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Income</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filter-type"
                  checked={localFilters.type === 'expense'}
                  onChange={() => handleFilterChange('type', 'expense')}
                  className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
                />
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-300">Expense</span>
                </div>
              </label>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Category</label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Wallet</label>
            <select
              value={localFilters.wallet}
              onChange={(e) => handleFilterChange('wallet', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">All Wallets</option>
              {wallets.map((wallet) => (
                <option key={wallet._id} value={wallet._id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">Date Range</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === '7d'}
                onChange={() => handleDateRangeChange('7d')}
                className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
              />
              <span className="text-sm text-gray-300">Last 7 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === '30d'}
                onChange={() => handleDateRangeChange('30d')}
                className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
              />
              <span className="text-sm text-gray-300">Last 30 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === '90d'}
                onChange={() => handleDateRangeChange('90d')}
                className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
              />
              <span className="text-sm text-gray-300">Last 90 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="date-range"
                checked={localFilters.dateRange === 'custom'}
                onChange={() => handleDateRangeChange('custom')}
                className="text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500/50"
              />
              <span className="text-sm text-gray-300">Custom</span>
            </label>
          </div>

          {/* Custom Date Range */}
          {localFilters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Start Date</label>
                <input
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">End Date</label>
                <input
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {localFilters.type && (
                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2">
                  {localFilters.type === 'income' ? 'Income' : 'Expense'}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.category && (
                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2">
                  {categories.find(c => c._id === localFilters.category)?.name || 'Category'}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.wallet && (
                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2">
                  {wallets.find(w => w._id === localFilters.wallet)?.name || 'Wallet'}
                  <button
                    onClick={() => handleFilterChange('wallet', '')}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {localFilters.dateRange !== '30d' && (
                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm flex items-center gap-2">
                  {localFilters.dateRange === '7d' && 'Last 7 days'}
                  {localFilters.dateRange === '30d' && 'Last 30 days'}
                  {localFilters.dateRange === '90d' && 'Last 90 days'}
                  {localFilters.dateRange === 'custom' && 'Custom range'}
                  <button
                    onClick={() => handleDateRangeChange('30d')}
                    className="text-indigo-400 hover:text-indigo-300"
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
