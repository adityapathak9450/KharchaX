import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, Wallet, ArrowUpRight, Search, Copy, Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'
import { InviteMemberModal } from '../../components/shared/InviteMemberModal'
import { SharedWalletCard } from '../../components/shared/SharedWalletCard'

export default function SharedWalletsPage() {
  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

  const queryClient = useQueryClient()

  const { data: sharedWalletsData, isLoading, refetch } = useQuery({
    queryKey: ['shared-wallets'],
    queryFn: () => apiClient.get('/shared-wallets').then(res => res.data.data),
  })

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.get('/wallets').then(res => res.data.data.wallets),
  })

  const createSharedWalletMutation = useMutation({
    mutationFn: (data) => apiClient.post('/shared-wallets', data),
    onSuccess: () => {
      toast.success('Shared wallet created successfully')
      queryClient.invalidateQueries({ queryKey: ['shared-wallets'] })
      setShowInviteModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create shared wallet')
    }
  })

  const joinSharedWalletMutation = useMutation({
    mutationFn: (inviteCode) => apiClient.post('/shared-wallets/join', { inviteCode }),
    onSuccess: () => {
      toast.success('Joined shared wallet successfully')
      queryClient.invalidateQueries({ queryKey: ['shared-wallets'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join shared wallet')
    }
  })

  const sharedWallets = sharedWalletsData?.sharedWallets ?? []

  const filteredWallets = sharedWallets.filter(sw =>
    sw.name.toLowerCase().includes(search.toLowerCase()) ||
    sw.walletId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (data) => {
    if (createSharedWalletMutation.isPending) return
    await createSharedWalletMutation.mutateAsync(data)
  }

  const handleJoin = (inviteCode) => {
    joinSharedWalletMutation.mutate(inviteCode)
  }

  const handleCreateClick = () => {
    setSelectedWallet(null)
    setShowInviteModal(true)
  }

  const copyInviteCode = (code, walletId) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(walletId)
    toast.success('Invite code copied to clipboard')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleJoinClick = () => {
    const input = document.querySelector('input[placeholder="Enter invite code"]')
    if (input?.value.trim()) {
      handleJoin(input.value.trim())
      input.value = ''
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Shared Wallets</h1>
              <p className="text-sm text-gray-400">
                {sharedWallets.length} shared wallet{sharedWallets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Shared Wallet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search shared wallets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* Join by code */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Join with invite code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter invite code"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleJoin(e.target.value.trim())
                    e.target.value = ''
                  }
                }}
              />
              <button
                onClick={handleJoinClick}
                disabled={joinSharedWalletMutation.isPending}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:bg-white/20 transition-all disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Wallets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-8 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredWallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No shared wallets</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'No wallets match your search' : 'Create your first shared wallet to get started'}
          </p>
          {!search && (
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Shared Wallet</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWallets.map((sharedWallet) => (
            <SharedWalletCard
              key={sharedWallet._id}
              sharedWallet={sharedWallet}
              copiedCode={copiedCode}
              onCopyCode={copyInviteCode}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleCreate}
          wallets={wallets || []}
          mode="create"
          isLoading={createSharedWalletMutation.isPending}
        />
      )}
    </div>
  )
}
