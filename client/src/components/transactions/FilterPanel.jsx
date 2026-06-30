import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Calendar, DollarSign, Tag as TagIcon } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useWallets } from '../../hooks/useWallets';

const FilterPanel = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState({
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    type: filters.type || '',
    category: filters.category || [],
    wallet: filters.wallet || [],
    minAmount: filters.minAmount || '',
    maxAmount: filters.maxAmount || '',
    tags: filters.tags || '',
  });

  const { categories } = useCategories();
  const { wallets } = useWallets();

  const handleCategoryToggle = (categoryId) => {
    setLocalFilters(prev => ({
      ...prev,
      category: prev.category.includes(categoryId)
        ? prev.category.filter(id => id !== categoryId)
        : [...prev.category, categoryId]
    }));
  };

  const handleWalletToggle = (walletId) => {
    setLocalFilters(prev => ({
      ...prev,
      wallet: prev.wallet.includes(walletId)
        ? prev.wallet.filter(id => id !== walletId)
        : [...prev.wallet, walletId]
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      startDate: '',
      endDate: '',
      type: '',
      category: [],
      wallet: [],
      minAmount: '',
      maxAmount: '',
      tags: '',
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.startDate) count++;
    if (localFilters.endDate) count++;
    if (localFilters.type) count++;
    if (localFilters.category.length > 0) count++;
    if (localFilters.wallet.length > 0) count++;
    if (localFilters.minAmount) count++;
    if (localFilters.maxAmount) count++;
    if (localFilters.tags) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 bg-elevated border-l border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-foreground hover:bg-hover rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 space-y-6 overflow-y-auto h-full pb-32">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-muted mb-3">
                <Calendar className="inline w-4 h-4 mr-2" />
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full input-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full input-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-muted mb-3">Type</label>
              <div className="space-y-2">
                {['', 'income', 'expense'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={localFilters.type === type}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-4 h-4 text-primary bg-hover border-border focus:ring-ring focus:ring-0"
                    />
                    <span className="text-sm text-foreground">
                      {type === '' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-muted mb-3">Categories</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category._id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.category.includes(category._id)}
                      onChange={() => handleCategoryToggle(category._id)}
                      className="w-4 h-4 text-primary bg-hover border-border rounded focus:ring-ring focus:ring-0"
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-foreground">{category.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Wallets */}
            <div>
              <label className="block text-sm font-medium text-muted mb-3">Wallets</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wallets.map((wallet) => (
                  <label key={wallet._id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.wallet.includes(wallet._id)}
                      onChange={() => handleWalletToggle(wallet._id)}
                      className="w-4 h-4 text-primary bg-hover border-border rounded focus:ring-ring focus:ring-0"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{wallet.name}</span>
                      <span className="text-xs text-muted bg-elevated px-2 py-0.5 rounded-full">
                        {wallet.type}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-muted mb-3">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Amount Range
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={localFilters.minAmount}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="w-full input-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  placeholder="Min amount"
                />
                <input
                  type="number"
                  value={localFilters.maxAmount}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full input-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  placeholder="Max amount"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-muted mb-3">
                <TagIcon className="inline w-4 h-4 mr-2" />
                Tags
              </label>
              <input
                type="text"
                value={localFilters.tags}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full input-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                placeholder="Search tags (comma separated)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-elevated border-t border-border">
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-4 bg-hover text-muted rounded-lg hover:bg-hover transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleApply}
                className="btn-primary flex-1 py-2 px-4 text-sm"
              >
                Apply Filters ({getActiveFilterCount()})
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FilterPanel;
