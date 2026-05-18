import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency, formatDate } from '../../utils/format'
import { WalletCard } from '../../components/dashboard/WalletCard'
import { CreateWalletModal } from '../../components/wallets/CreateWalletModal'
import { TransferModal } from '../../components/wallets/TransferModal'

export default function WalletsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)

  const queryClient = useQueryClient()

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets', filter, search],
    queryFn: () => apiClient.get('/wallets', {
      params: { search, type: filter !== 'all' ? filter : undefined }
    }).then(res => res.data.data.wallets),
    refetchInterval: 30000
  })

  const deleteWalletMutation = useMutation({
    mutationFn: (walletId) => apiClient.delete(`/wallets/${walletId}`),
    onSuccess: () => {
      toast.success('Wallet deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete wallet')
    }
  })

  const handleDeleteWallet = (wallet) => {
    if (window.confirm(`Are you sure you want to delete "${wallet.name}"?`)) {
      deleteWalletMutation.mutate(wallet._id)
    }
  }

  const filteredWallets = wallets?.filter(wallet => 
    wallet.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalBalance = filteredWallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallets</h1>
          <p className="text-gray-400 mt-1">Manage your money across different accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
            Transfer
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Wallet
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Balance</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Wallets Count</p>
              <p className="text-xl font-bold text-white">{filteredWallets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MoreHorizontal className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Types</p>
              <p className="text-xl font-bold text-white">
                {[...new Set(filteredWallets.map(w => w.type))].length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search wallets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
        >
          <option value="all">All Types</option>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="business">Business</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      {/* Wallets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/10 rounded mb-4"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredWallets.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No wallets found</h3>
          <p className="text-gray-400 mb-6">
            {search ? 'Try adjusting your search terms' : 'Create your first wallet to get started'}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Wallet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWallets.map((wallet) => (
            <motion.div
              key={wallet._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <WalletCard wallet={wallet} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateWalletModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['wallets'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
          }}
        />
      )}

      {showTransferModal && (
        <TransferModal
          wallets={wallets || []}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false)
            queryClient.invalidateQueries({ queryKey: ['wallets'] })
          }}
        />
      )}
    </div>
  )
}
