import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus,Search,Filter,Download,Upload,MoreHorizontal,ArrowUpRight,ArrowDownRight,Calendar,Wallet, Tag,Receipt,ArrowLeftRight,UtensilsCrossed,ShoppingBag,Car,Home,Landmark,CircleDollarSign,CreditCard,Gift,HeartPulse
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency, formatDateTime, formatRelativeTime } from '../../utils/format'
import { TransactionForm } from '../../components/transactions/TransactionForm'
import { TransactionFilters } from '../../components/transactions/TransactionFilters'
import { CSVImportModal } from '../../components/transactions/CSVImportModal'

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    wallet: '',
    dateRange: '30d',
    startDate: '',
    endDate: ''
  })

  const queryClient = useQueryClient()

  const iconMap = {
  receipt: Receipt,
  transfer: ArrowLeftRight,
  'circle-dot': CircleDollarSign,
  utensils: UtensilsCrossed,
  food: UtensilsCrossed,
  shopping: ShoppingBag,
  travel: Car,
  home: Home,
  bills: Landmark,
  salary: Wallet,
  card: CreditCard,
  gift: Gift,
  health: HeartPulse
}

const getTransactionIcon = (iconName) => {
  return iconMap[iconName?.toLowerCase()] || Wallet
}

const getTransactionIconStyles = (type, color) => {
  if (type === 'income') {
    return {
      background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(22,163,74,0.15))',
      border: '1px solid rgba(34,197,94,0.25)',
      color: '#4ade80'
    }
  }

  if (type === 'expense') {
    return {
      background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(185,28,28,0.12))',
      border: '1px solid rgba(239,68,68,0.25)',
      color: '#f87171'
    }
  }

  return {
    background: `${color || '#6366f1'}20`,
    border: `1px solid ${color || '#6366f1'}30`,
    color: color || '#a5b4fc'
  }
}

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions', filters, search],
    queryFn: () => apiClient.get('/transactions', {
      params: { 
        search,
        ...filters,
        limit: 50
      }
    }).then(res => res.data.data),
    refetchInterval: 30000
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(res => res.data.data)
  })

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.get('/wallets').then(res => res.data.data.wallets)
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/transactions/${id}`),
    onSuccess: () => {
      toast.success('Transaction deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete transaction')
    }
  })

  const exportCSVMutation = useMutation({
    mutationFn: () => apiClient.get('/transactions/export', { responseType: 'blob' }),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Transactions exported successfully')
    },
    onError: () => {
      toast.error('Failed to export transactions')
    }
  })

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDelete = (transaction) => {
    if (window.confirm(`Are you sure you want to delete this ${transaction.type} of ${formatCurrency(transaction.amount)}?`)) {
      deleteTransactionMutation.mutate(transaction._id)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      wallet: '',
      dateRange: '30d',
      startDate: '',
      endDate: ''
    })
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '30d').length

  const totalIncome = transactions?.transactions?.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0) || 0
  const totalExpenses = transactions?.transactions?.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0) || 0
  const netAmount = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-1">Track all your income and expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCSVMutation.mutate()}
            disabled={exportCSVMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Income</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${netAmount >= 0 ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Net Amount</p>
              <p className={`text-xl font-bold ${netAmount >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(Math.abs(netAmount))}
                {netAmount < 0 && ' (Expense)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeFiltersCount > 0 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                : 'bg-white/10 text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <TransactionFilters
          filters={filters}
          categories={categories || []}
          wallets={wallets || []}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Transactions List */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-48"></div>
                    <div className="h-3 bg-white/10 rounded w-32"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions?.transactions?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-6">
              {search || activeFiltersCount > 0 
                ? 'Try adjusting your search or filters' 
                : 'Start tracking your finances by adding your first transaction'
              }
            </p>
            {!search && activeFiltersCount === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {transactions?.transactions?.map((transaction, index) => (
                  <motion.tr
                    key={`list-${transaction._id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                       {(() => {
                        const IconComponent = getTransactionIcon(transaction.category?.icon)

                         return (
                                 <div
                         className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300"
                                style={getTransactionIconStyles(
                                  transaction.type,
                                transaction.category?.color
                                )}
                              >
                                <IconComponent className="h-5 w-5" />
                              </div>
                            )
                           })()} 
                        <div>
                          <p className="font-medium text-white">
                             {transaction.notes
                           ?.replace('Shared settlement paid — ', 'Settlement Paid • ')
                            ?.replace('Shared settlement received — ', 'Settlement Received • ')
                            ?.replace('Shared expense: ', '')
                                  ?.replace('Shared expense in ', 'Expense • ')
                                || 'Untitled Transaction'}
                          </p>
                          {transaction.tags?.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {transaction.tags
                                  .filter(tag => 
                                   !tag.startsWith('shared-wallet:') &&
                                    tag !== 'shared-settlement' &&
                                    tag !== 'shared-expense'
                                        )
                                      .slice(0, 2)
                                       .map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white/10 text-xs text-gray-400 rounded-full">
                                  {tag}
                                </span>
                              ))}
                              {transaction.tags.length > 2 && (
                                <span className="px-2 py-0.5 bg-white/10 text-xs text-gray-400 rounded-full">
                                  +{transaction.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: transaction.category?.color || '#6366f1' }}
                        />
                        <span className="text-sm text-gray-300">
                          {transaction.category?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">
                        {transaction.wallet?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div>{formatRelativeTime(transaction.date)}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(transaction.date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-white'
                      }`}>
                        {transaction.type === 'income' && '+'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories || []}
          wallets={wallets || []}
          onClose={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingTransaction(null)
            refetch()
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
          }}
        />
      )}

      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            refetch()
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
          }}
        />
      )}
    </div>
  )
}
