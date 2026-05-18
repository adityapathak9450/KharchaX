import { useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'
import { formatCurrency } from '../../utils/format'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function WalletTransactions({ walletId, transactions }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 w-48"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <motion.div
              key={transaction._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/[0.08] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{transaction.description || 'Transaction'}</p>
                  <p className="text-xs text-gray-500">
                    {transaction.category?.name || 'Uncategorized'} • {dayjs(transaction.date).fromNow()}
                  </p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${
                transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
