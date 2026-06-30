import { motion } from 'framer-motion'
import { Users, Wallet, Copy, Check, ArrowUpRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function SharedWalletCard({ sharedWallet, copiedCode, onCopyCode }) {
  const memberCount = sharedWallet.memberCount || sharedWallet.members?.length || 0
  const balance = sharedWallet.totalBalance || 0
  const walletName = sharedWallet.walletId?.name || 'Unknown Wallet'
  const inviteCode = sharedWallet.inviteCode || ''
  const createdAt = sharedWallet.createdAt ? dayjs(sharedWallet.createdAt).fromNow() : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl card hover:border-border hover:bg-hover transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{sharedWallet.name}</h3>
            <p className="text-xs text-muted">{walletName}</p>
          </div>
        </div>
        <Link
          to={`/dashboard/shared-wallets/${sharedWallet._id}`}
          className="p-2 rounded-lg hover:bg-hover text-muted hover:text-foreground transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Total Balance</p>
        <p className="text-xl font-bold text-foreground">₹{balance.toLocaleString('en-IN')}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted" />
          <span className="text-sm text-muted">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted" />
          <span className="text-sm text-muted">{createdAt}</span>
        </div>
      </div>

      {/* Invite Code */}
      {inviteCode && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border shadow-sm">
          <code className="flex-1 text-xs text-muted font-mono">{inviteCode}</code>
          <button
            onClick={() => onCopyCode(inviteCode, sharedWallet._id)}
            className="p-1.5 rounded hover:bg-hover text-muted hover:text-foreground transition-all"
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
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex -space-x-2">
            {sharedWallet.members?.slice(0, 4).map((member, idx) => (
              <div
                key={member.userId?._id || idx}
                className="w-7 h-7 rounded-full bg-primary border-2 border-canvas flex items-center justify-center text-[10px] text-primary-foreground font-medium"
                title={member.userId?.name || 'Unknown'}
              >
                {member.userId?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-7 h-7 rounded-full bg-elevated border-2 border-canvas flex items-center justify-center text-[10px] text-foreground font-medium">
                +{memberCount - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
