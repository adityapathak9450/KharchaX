import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Wallet, TrendingUp, Calendar, Plus, Trash2, UserMinus, Copy, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'
import { InviteMemberModal } from '../../components/shared/InviteMemberModal'
import { SharedExpenseForm } from '../../components/shared/SharedExpenseForm'
import { SettlementCard } from '../../components/shared/SettlementCard'
import { SettlementModal } from '../../components/shared/SettlementModal'
import { MemberList } from '../../components/shared/MemberList'
import { useAuthStore } from '../../store/authStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function SharedWalletDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [activeSettlement, setActiveSettlement] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const currentUserId = user?._id || user?.id

  const { data: sharedWalletData, isLoading, refetch } = useQuery({
    queryKey: ['shared-wallet', id],
    queryFn: () => apiClient.get(`/shared-wallets/${id}`).then(res => res.data.data),
    enabled: !!id
  })


  const { data: settlementsData } = useQuery({
    queryKey: ['shared-wallet-settlements', id],
    queryFn: () => apiClient.get(`/shared-wallets/${id}/settlements`).then(res => res.data.data),
    enabled: !!id
  })
  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets')
      return res.data.data?.wallets || []
    },
    enabled: showExpenseForm || showSettlementModal,
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => apiClient.delete(`/shared-wallets/${id}/members/${memberId}`),
    onSuccess: () => {
      toast.success('Member removed successfully')
      queryClient.invalidateQueries({ queryKey: ['shared-wallet', id] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  })
  const addExpenseMutation = useMutation({
    mutationFn: (data) => apiClient.post(`/shared-wallets/${id}/expenses`, data),
    onSuccess: () => {
      toast.success('Expense added successfully')
      queryClient.invalidateQueries({ queryKey: ['shared-wallet', id] })
      queryClient.invalidateQueries({ queryKey: ['shared-wallet-settlements', id] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setShowExpenseForm(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add expense')
    },
  })

  const settleMutation = useMutation({
    mutationFn: (data) => apiClient.post(`/shared-wallets/${id}/settle`, data),
    onSuccess: () => {
      toast.success('Settlement recorded successfully')
      queryClient.invalidateQueries({ queryKey: ['shared-wallet', id] })
      queryClient.invalidateQueries({ queryKey: ['shared-wallet-settlements', id] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setShowSettlementModal(false)
      setActiveSettlement(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record settlement')
    },
  })

  const sharedWallet = sharedWalletData?.sharedWallet
 
  const settlements = settlementsData?.settlements ?? []
  const memberBalances = settlementsData?.memberBalances ?? []
  const settlementSummary = settlementsData?.summary
  const expenses = sharedWallet?.expenses || []

  const copyInviteCode = () => {
    if (sharedWallet?.inviteCode) {
      navigator.clipboard.writeText(sharedWallet.inviteCode)
      setCopiedCode(sharedWallet._id)
      toast.success('Invite code copied to clipboard')
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(memberId)
    }
  }

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

  if (!sharedWallet) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Shared wallet not found</p>
          <Link to="/dashboard/shared-wallets" className="mt-4 text-primary hover:text-primary/80">
            ← Back to Shared Wallets
          </Link>
        </div>
      </div>
    )
  }

  const memberCount = sharedWallet.memberCount || sharedWallet.members?.length || 0
 const balance = sharedWallet.totalBalance || 0
  const walletName = sharedWallet.walletId?.name || 'Unknown Wallet'
  const inviteCode = sharedWallet.inviteCode || ''

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard/shared-wallets"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shared Wallets
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sharedWallet.name}</h1>
              <p className="text-sm text-muted">{walletName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary px-4 py-2 text-sm gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-elevated transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl card">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-foreground">₹{balance.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-5 rounded-xl card">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted">Members</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{memberCount}</p>
        </div>
        <div className="p-5 rounded-xl card">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-muted">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{sharedWallet.expenses?.length || 0}</p>
        </div>
      </div>

      {/* Invite Code */}
      {inviteCode && (
        <div className="mb-8 p-4 rounded-xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Share this invite code</p>
              <code className="text-lg text-foreground font-mono">{inviteCode}</code>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-elevated border border-border text-foreground text-sm hover:bg-elevated transition-all"
            >
              {copiedCode === sharedWallet._id ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-6">
          {['overview', 'members', 'settlements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-foreground'
                  : 'text-muted hover:text-muted'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Transactions */}
          <div className="p-5 rounded-xl card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {expenses
  .slice()
  .reverse()
  .slice(0, 5)
  .map((expense) => (
                <div
  key={expense._id}
  className="flex items-center justify-between p-3 rounded-lg bg-hover"
>
  <div>
    <p className="text-sm font-medium text-foreground">
      {expense.description || 'Expense'}
    </p>

    <p className="text-xs text-muted">
      Paid by{' '}
      {
        sharedWallet.members.find(
          m =>
            (m.userId?._id || m.userId).toString() ===
            expense.paidBy?.toString()
        )?.userId?.name || 'Unknown'
      }

      {' • '}

      {dayjs(expense.date).fromNow()}
    </p>
  </div>

  <p className="text-sm font-semibold text-foreground">
    {formatCurrency(expense.amount)}
  </p>
</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Fixed Members Tab Content Block */}
      {activeTab === 'members' && (
        <MemberList
          members={sharedWallet.members || []}
          onRemoveMember={handleRemoveMember}
          isOwner={toIdString(sharedWallet.createdBy) === currentUserId}
        />
      )}

      {activeTab === 'settlements' && (
        <SettlementCard
          settlements={settlements}
          memberBalances={memberBalances}
          summary={settlementSummary}
          currentUserId={currentUserId}
          onSettle={(suggestion) => {
            setActiveSettlement(suggestion)
            setShowSettlementModal(true)
          }}
        />
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={() => {
            setShowInviteModal(false)
            refetch()
          }}
          wallets={[]}
          mode="invite"
        />
      )}

      {showExpenseForm && (
        <SharedExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSubmit={(data) => addExpenseMutation.mutate(data)}
          members={sharedWallet.members || []}
          wallets={wallets}
          isLoading={addExpenseMutation.isPending}
        />
      )}

      {showSettlementModal && activeSettlement && (
        <SettlementModal
          onClose={() => {
            setShowSettlementModal(false)
            setActiveSettlement(null)
          }}
          onSubmit={(data) => settleMutation.mutate(data)}
          isLoading={settleMutation.isPending}
          suggestion={activeSettlement}
          wallets={wallets}
        />
      )}
    </div>
  )
}

function toIdString(id) {
  if (!id) return ''
  return id._id ? id._id.toString() : id.toString()
}