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
        <div className="space-y-4">
          <div className="skeleton h-8 w-1/3" />
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Wallet not found</p>
          <Link to="/dashboard/wallets" className="mt-4 text-primary hover:text-primary/80">
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
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors"
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
              <h1 className="text-2xl font-bold text-foreground">{wallet.name}</h1>
              <p className="text-sm text-muted capitalize">{wallet.type} Wallet</p>
            </div>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="btn-primary px-4 py-2 text-sm gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border">
        <p className="text-sm text-muted mb-2">Total Balance</p>
        <p className="text-4xl font-bold text-foreground mb-4">{formatCurrency(wallet.balance)}</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Income</p>
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
              <p className="text-xs text-muted">Expenses</p>
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
              <p className="text-xs text-muted">Transactions</p>
              <p className="text-sm font-semibold text-foreground">{transactions.length}</p>
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
