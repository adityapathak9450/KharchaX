import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, ArrowUpRight, Calendar, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'
import { WalletStats } from '../../components/wallet/WalletStats'
import { WalletTransactions } from '../../components/wallet/WalletTransactions'
import { TransferModal } from '../../components/wallet/TransferModal'
import { useState } from 'react'

export default function WalletDetailPage() {
  const { id } = useParams()
  const [showTransferModal, setShowTransferModal] = useState(false)

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet', id],
    queryFn: () => apiClient.get(`/wallets/${id}`).then(res => res.data.data),
    enabled: !!id
  })

  const { data: transactionsData } = useQuery({
    queryKey: ['wallet-transactions', id],
    queryFn: () => apiClient.get(`/wallets/${id}/transactions`).then(res => res.data.data),
    enabled: !!id
  })

  const wallet = walletData?.wallet
  const transactions = transactionsData?.transactions ?? []

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400">Wallet not found</p>
          <Link to="/dashboard/wallets" className="mt-4 text-indigo-400 hover:text-indigo-300">
            ← Back to Wallets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard/wallets"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallets
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${wallet.color}20` }}>
              <Wallet className="w-7 h-7" style={{ color: wallet.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{wallet.name}</h1>
              <p className="text-sm text-gray-400 capitalize">{wallet.type} Wallet</p>
            </div>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/[0.08]">
        <p className="text-sm text-gray-400 mb-2">Total Balance</p>
        <p className="text-4xl font-bold text-white mb-4">{formatCurrency(wallet.balance)}</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Income</p>
              <p className="text-sm font-semibold text-green-400">
                {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-sm font-semibold text-red-400">
                {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="text-sm font-semibold text-white">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <WalletStats walletId={id} />

      {/* Transactions */}
      <WalletTransactions walletId={id} transactions={transactions} />

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          fromWalletId={id}
          onSuccess={() => setShowTransferModal(false)}
        />
      )}
    </div>
  )
}
