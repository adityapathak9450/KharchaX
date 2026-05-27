import { ArrowUpRight, ArrowDownRight, User } from 'lucide-react'
import { formatCurrency } from '../../utils/format'

export function SettlementCard({ settlements }) {

  if (!settlements?.length) {
    return (
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-sm text-gray-500">
          Everyone is settled up 🎉
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {settlements.map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]"
        >
          <p className="text-sm text-white">
            <span className="font-semibold text-red-400">
              {item.from}
            </span>

            {' '}pays{' '}

            <span className="font-semibold text-green-400">
              {item.to}
            </span>

            {' '}

            <span className="font-bold">
              ₹{item.amount}
            </span>
          </p>
        </div>
      ))}
    </div>
  )
}