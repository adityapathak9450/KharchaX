import { ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '../../utils/format'

export function SettlementCard({
  settlements = [],
  memberBalances = [],
  summary,
  currentUserId,
  onSettle,
}) {
  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
            <p className="text-xs text-muted mb-1">Total group expenses</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(summary.totalExpenses || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
            <p className="text-xs text-muted mb-1">You are owed</p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(summary.yourOwed || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
            <p className="text-xs text-muted mb-1">You owe</p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(summary.yourOwes || 0)}
            </p>
          </div>
        </div>
      )}

      <div className="p-5 rounded-xl card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Member balances</h3>
        {memberBalances.length === 0 ? (
          <p className="text-sm text-muted">No balance data yet</p>
        ) : (
          <div className="space-y-2">
            {memberBalances.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-hover"
              >
                <span className="text-sm text-foreground">{member.name}</span>
                <span
                  className={`text-sm font-semibold ${
                    member.balance > 0
                      ? 'text-green-400'
                      : member.balance < 0
                        ? 'text-red-400'
                        : 'text-muted'
                  }`}
                >
                  {member.balance > 0
                    ? `gets back ${formatCurrency(member.balance)}`
                    : member.balance < 0
                      ? `owes ${formatCurrency(Math.abs(member.balance))}`
                      : 'settled'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 rounded-xl card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Suggested settlements</h3>
        {!settlements.length ? (
          <p className="text-sm text-muted">Everyone is settled up</p>
        ) : (
          <div className="space-y-3">
            {settlements.map((item, index) => {
              const canSettle =
                item.fromUserId === currentUserId && typeof onSettle === 'function'

              return (
                <div
                  key={`${item.fromUserId}-${item.toUserId}-${index}`}
                  className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-center justify-between gap-3"
                >
                  <p className="text-sm text-foreground">
                    <span className="font-semibold text-red-400">{item.from}</span> pays{' '}
                    <span className="font-semibold text-green-400">{item.to}</span>{' '}
                    <span className="font-bold">{formatCurrency(item.amount)}</span>
                  </p>
                  {canSettle && (
                    <button
                      onClick={() => onSettle(item)}
                      className="btn-primary px-3 py-1.5 text-xs gap-1 whitespace-nowrap"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      Settle
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
