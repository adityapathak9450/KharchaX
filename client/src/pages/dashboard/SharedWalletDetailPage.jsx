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
import { MemberList } from '../../components/shared/MemberList'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function SharedWalletDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)

  const queryClient = useQueryClient()

  // 1. Safe parsing of local storage at the top level
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

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
  const { data: walletsData } = useQuery({
  queryKey: ['wallets'],
  queryFn: () =>
    apiClient.get('/wallets').then((res) => res.data.data)
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
  mutationFn: (data) =>
    apiClient.post(`/shared-wallets/${id}/expenses`, data),

  onSuccess: () => {
    toast.success('Expense added successfully')

    queryClient.invalidateQueries({
      queryKey: ['shared-wallet', id]
    })

    queryClient.invalidateQueries({
      queryKey: ['shared-wallet-settlements', id]
    })

    setShowExpenseForm(false)
  },

  onError: (error) => {
    toast.error(
      error.response?.data?.message || 'Failed to add expense'
    )
  }
})

  const sharedWallet = sharedWalletData?.sharedWallet
 
  const settlements = settlementsData?.settlements ?? {}
  const expenses = sharedWallet?.expenses || []
  const wallets = walletsData?.wallets || []

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!sharedWallet) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400">Shared wallet not found</p>
          <Link to="/dashboard/shared-wallets" className="mt-4 text-indigo-400 hover:text-indigo-300">
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
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
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
              <h1 className="text-2xl font-bold text-white">{sharedWallet.name}</h1>
              <p className="text-sm text-gray-400">{walletName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{balance.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-gray-400">Members</span>
          </div>
          <p className="text-2xl font-bold text-white">{memberCount}</p>
        </div>
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">{sharedWallet.expenses?.length || 0}</p>
        </div>
      </div>

      {/* Invite Code */}
      {inviteCode && (
        <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Share this invite code</p>
              <code className="text-lg text-white font-mono">{inviteCode}</code>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:bg-white/20 transition-all"
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
      <div className="mb-6 border-b border-white/[0.08]">
        <div className="flex gap-6">
          {['overview', 'members', 'settlements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
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
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-sm text-gray-500">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {expenses
  .slice()
  .reverse()
  .slice(0, 5)
  .map((expense) => (
                <div
  key={expense._id}
  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
>
  <div>
    <p className="text-sm font-medium text-white">
      {expense.description || 'Expense'}
    </p>

    <p className="text-xs text-gray-500">
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

  <p className="text-sm font-semibold text-white">
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
          isOwner={sharedWallet.createdBy?._id === currentUser?._id}
        />
      )}

      {activeTab === 'settlements' && (
        <SettlementCard settlements={settlements} />
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
    onSubmit={(data) => {
      addExpenseMutation.mutate(data)
    }}
    members={sharedWallet.members || []}
    wallets={wallets}
  />
)}
    </div>
  )
}