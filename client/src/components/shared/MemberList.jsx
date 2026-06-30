import { UserMinus, Crown, Shield, Eye } from 'lucide-react'

export function MemberList({ members, onRemoveMember, isOwner }) {
  if (!members || members.length === 0) {
    return (
      <div className="p-5 rounded-xl card">
        <p className="text-sm text-muted">No members yet</p>
      </div>
    )
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'editor':
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <Eye className="w-4 h-4 text-muted" />
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Owner'
      case 'editor':
        return 'Editor'
      default:
        return 'Viewer'
    }
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const memberId = member.userId?._id || member.userId
        const canRemove = isOwner && member.role !== 'owner'

        return (
          <div
            key={memberId}
            className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border shadow-sm hover:bg-hover transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                {member.userId?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">{member.userId?.name || 'Unknown'}</p>
                  {getRoleIcon(member.role)}
                </div>
                <p className="text-xs text-muted">
                  {getRoleLabel(member.role)} • Contributed ₹{(member.totalContributed || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            {canRemove && (
              <button
                onClick={() => onRemoveMember(memberId)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-all"
                title="Remove member"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
