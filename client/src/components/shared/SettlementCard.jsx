import { ArrowUpRight, ArrowDownRight, User } from 'lucide-react'
import { formatCurrency } from '../../utils/format'

export function SettlementCard({ settlements }) {
  const settlementArray = Object.values(settlements)

  if (settlementArray.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-sm text-gray-500">No settlements needed</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {settlementArray.map((settlement) => {
        const isOwed = settlement.owed > 0
        const isOwes = settlement.owes > 0

        return (
          <div
            key={settlement.userId}
            className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                  {settlement.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{settlement.userName}</p>
                  <p className="text-xs text-gray-500">Balance: {formatCurrency(settlement.balance)}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isOwed ? 'bg-green-500/10 text-green-400' : isOwes ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'
              }`}>
                {isOwed ? (
                  <>
                    <ArrowDownRight className="w-4 h-4" />
                    <span className="text-sm font-medium">Gets back {formatCurrency(settlement.owed)}</span>
                  </>
                ) : isOwes ? (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm font-medium">Owes {formatCurrency(settlement.owes)}</span>
                  </>
                ) : (
                  <span className="text-sm font-medium">Settled</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
