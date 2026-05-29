import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, AlertTriangle, TrendingUp, Target, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'
import { BudgetCard } from '../../components/budgets/BudgetCard'
import { CreateBudgetModal } from '../../components/budgets/CreateBudgetModal'
import { EditBudgetModal } from '../../components/budgets/EditBudgetModal'
import { BudgetFilters } from '../../components/budgets/BudgetFilters'

export default function BudgetsPage() {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // ── Edit state ──────────────────────────────────────────────
  const [editingBudget, setEditingBudget] = useState(null)
  // ────────────────────────────────────────────────────────────

  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    category: '',
    status: 'all',
  })

  const queryClient = useQueryClient()

  const { data: budgets, isLoading, refetch } = useQuery({
    queryKey: ['budgets', filters],
    queryFn: () =>
      apiClient.get('/budgets', { params: filters }).then((res) => res.data.data.budgets),
    refetchInterval: 30000,
  })

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: () => apiClient.get('/budgets/summary').then((res) => res.data.data),
    refetchInterval: 60000,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((res) => res.data.data),
  })

  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/budgets/${id}`),
    onSuccess: () => {
      toast.success('Budget deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete budget')
    },
  })

  const handleDeleteBudget = (budget) => {
    if (window.confirm(`Are you sure you want to delete "${budget.name}" budget?`)) {
      deleteBudgetMutation.mutate(budget._id)
    }
  }

  // ── Edit handlers ────────────────────────────────────────────
  const handleEditBudget = (budget) => {
    setEditingBudget(budget)
  }

  const handleEditSuccess = () => {
    setEditingBudget(null)
    refetch()
  }
  // ────────────────────────────────────────────────────────────

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      category: '',
      status: 'all',
    })
  }

  const activeFiltersCount =
    (filters.category ? 1 : 0) + (filters.status !== 'all' ? 1 : 0)

  const totalBudget = budgets?.reduce((sum, budget) => sum + budget.amount, 0) || 0
  const totalSpent = budgets?.reduce((sum, budget) => sum + budget.spent, 0) || 0
  const totalRemaining = totalBudget - totalSpent
  const averageUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const exceededBudgets = budgets?.filter((budget) => budget.isExceeded) || []
  const alertingBudgets =
    budgets?.filter((budget) => budget.shouldAlert && !budget.isExceeded) || []
  console.log(categories)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budgets</h1>
          <p className="text-gray-400 mt-1">Manage your spending limits and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Budget</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Spent</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                totalRemaining >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
            >
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Remaining</p>
              <p
                className={`text-xl font-bold ${
                  totalRemaining >= 0 ? 'text-white' : 'text-red-400'
                }`}
              >
                {formatCurrency(Math.abs(totalRemaining))}
                {totalRemaining < 0 && ' (Over)'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                averageUtilization > 80
                  ? 'bg-red-500/20'
                  : averageUtilization > 60
                  ? 'bg-yellow-500/20'
                  : 'bg-green-500/20'
              }`}
            >
              <Target className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Utilization</p>
              <p
                className={`text-xl font-bold ${
                  averageUtilization > 80
                    ? 'text-red-400'
                    : averageUtilization > 60
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}
              >
                {averageUtilization.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(exceededBudgets.length > 0 || alertingBudgets.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exceededBudgets.length > 0 && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-400">Budgets Exceeded</h3>
                  <p className="text-sm text-red-300">
                    {exceededBudgets.length} budget{exceededBudgets.length > 1 ? 's' : ''} over
                    limit
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {exceededBudgets.slice(0, 3).map((budget) => (
                  <div
                    key={budget._id}
                    className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.color }}
                      />
                      <span className="text-sm text-white">{budget.name}</span>
                    </div>
                    <span className="text-sm text-red-400">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alertingBudgets.length > 0 && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">Budget Alerts</h3>
                  <p className="text-sm text-yellow-300">
                    {alertingBudgets.length} budget{alertingBudgets.length > 1 ? 's' : ''} near
                    limit
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {alertingBudgets.slice(0, 3).map((budget) => (
                  <div
                    key={budget._id}
                    className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.color }}
                      />
                      <span className="text-sm text-white">{budget.name}</span>
                    </div>
                    <span className="text-sm text-yellow-400">
                      {budget.utilizationPercent.toFixed(1)}% used
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search budgets..."
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
        <BudgetFilters
          filters={filters}
          categories={categories || []}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 animate-pulse"
            >
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/10 rounded mb-4"></div>
              <div className="h-3 bg-white/10 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : budgets?.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No budgets found</h3>
          <p className="text-gray-400 mb-6">
            {search || activeFiltersCount > 0
              ? 'Try adjusting your search or filters'
              : 'Create your first budget to start tracking your spending'}
          </p>
          {!search && activeFiltersCount === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Budget
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets
            .filter((budget) =>
              budget.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((budget) => (
              <motion.div
                key={budget._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <BudgetCard
                  budget={budget}
                  onDelete={() => handleDeleteBudget(budget)}
                  onEdit={handleEditBudget}   // ← pass the handler
                />
              </motion.div>
            ))}
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <CreateBudgetModal
          categories={categories || []}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
            queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
          }}
        />
      )}

      {/* ── Edit Budget Modal ─────────────────────────────────── */}
      {editingBudget && (
        <EditBudgetModal
          budget={editingBudget}
          categories={categories || []}
          onClose={() => setEditingBudget(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      {/* ─────────────────────────────────────────────────────── */}
    </div>
  )
}
