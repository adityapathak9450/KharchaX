import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Plus, Wallet } from 'lucide-react'

export function InviteMemberModal({ onClose, onSubmit, wallets, mode = 'invite', isLoading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    walletId: '',
    memberEmails: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting || isLoading) return
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {mode === 'create' ? 'Create Shared Wallet' : 'Invite Members'}
              </h2>
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
            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Shared Wallet Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Family Expenses"
                    className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Select Wallet</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                    <select
                      value={formData.walletId}
                      onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select a wallet</option>
                      {wallets.map((wallet) => (
                        <option key={wallet._id} value={wallet._id}>
                          {wallet.name} - ₹{wallet.balance.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                {mode === 'create' ? 'Member Emails (Optional)' : 'Member Emails'}
              </label>
              <textarea
                value={formData.memberEmails}
                onChange={(e) => setFormData({ ...formData, memberEmails: e.target.value })}
                placeholder="Enter emails separated by commas"
                className="w-full px-4 py-2.5 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all resize-none h-24"
              />
              <p className="text-xs text-muted mt-1">
                Members will receive an invite code to join
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-border shadow-sm text-foreground text-sm font-medium hover:bg-hover transition-all disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {isSubmitting || isLoading ? 'Creating...' : (mode === 'create' ? 'Create' : 'Send Invites')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
