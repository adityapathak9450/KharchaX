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
    <div className="p-6 rounded-xl card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-border shadow-sm rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 w-48"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <motion.div
              key={transaction._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-lg bg-hover hover:bg-hover transition-all"
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
                  <p className="text-sm font-medium text-foreground">{transaction.description || 'Transaction'}</p>
                  <p className="text-xs text-muted">
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
