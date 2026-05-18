import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'

export function WalletStats({ walletId }) {
  const { data: analyticsData } = useQuery({
    queryKey: ['wallet-analytics', walletId],
    queryFn: () => apiClient.get(`/analytics?wallet=${walletId}`).then(res => res.data.data),
    enabled: !!walletId
  })

  const stats = analyticsData || {}

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-xs text-gray-500 mb-1">This Month</p>
        <p className="text-lg font-bold text-white">{formatCurrency(stats.monthlyIncome || 0)}</p>
        <p className="text-xs text-green-400 mt-1">Income</p>
      </div>
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-xs text-gray-500 mb-1">This Month</p>
        <p className="text-lg font-bold text-white">{formatCurrency(stats.monthlyExpense || 0)}</p>
        <p className="text-xs text-red-400 mt-1">Expenses</p>
      </div>
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-xs text-gray-500 mb-1">Average</p>
        <p className="text-lg font-bold text-white">{formatCurrency(stats.avgDailyExpense || 0)}</p>
        <p className="text-xs text-gray-400 mt-1">Daily Spend</p>
      </div>
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-xs text-gray-500 mb-1">Top Category</p>
        <p className="text-lg font-bold text-white truncate">{stats.topCategory?.name || 'N/A'}</p>
        <p className="text-xs text-gray-400 mt-1">Most Spent</p>
      </div>
    </div>
  )
}
