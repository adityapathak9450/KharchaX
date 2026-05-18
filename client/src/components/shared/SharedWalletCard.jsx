import { motion } from 'framer-motion'
import { Users, Wallet, Copy, Check, ArrowUpRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function SharedWalletCard({ sharedWallet, copiedCode, onCopyCode }) {
  const memberCount = sharedWallet.memberCount || sharedWallet.members?.length || 0
  const balance = sharedWallet.walletId?.balance || 0
  const walletName = sharedWallet.walletId?.name || 'Unknown Wallet'
  const inviteCode = sharedWallet.inviteCode || ''
  const createdAt = sharedWallet.createdAt ? dayjs(sharedWallet.createdAt).fromNow() : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{sharedWallet.name}</h3>
            <p className="text-xs text-gray-500">{walletName}</p>
          </div>
        </div>
        <Link
          to={`/dashboard/shared-wallets/${sharedWallet._id}`}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Total Balance</p>
        <p className="text-xl font-bold text-white">₹{balance.toLocaleString('en-IN')}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">{createdAt}</span>
        </div>
      </div>

      {/* Invite Code */}
      {inviteCode && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
          <code className="flex-1 text-xs text-gray-400 font-mono">{inviteCode}</code>
          <button
            onClick={() => onCopyCode(inviteCode, sharedWallet._id)}
            className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            title="Copy invite code"
          >
            {copiedCode === sharedWallet._id ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Members Preview */}
      {memberCount > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.08]">
          <div className="flex -space-x-2">
            {sharedWallet.members?.slice(0, 4).map((member, idx) => (
              <div
                key={member.userId?._id || idx}
                className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-[#0f0f0f] flex items-center justify-center text-[10px] text-white font-medium"
                title={member.userId?.name || 'Unknown'}
              >
                {member.userId?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-[#0f0f0f] flex items-center justify-center text-[10px] text-white font-medium">
                +{memberCount - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
