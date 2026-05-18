import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  AlertCircle,
  Plus
} from 'lucide-react'

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import { apiClient } from '../../lib/apiClient'

import { StatCard } from '../../components/dashboard/StatCard'
import { WalletCard } from '../../components/dashboard/WalletCard'
import { RecentTransactions } from '../../components/dashboard/RecentTransactions'
import { BudgetProgress } from '../../components/dashboard/BudgetProgress'

import { TransactionForm } from '../../components/transactions/TransactionForm'
import { CreateWalletModal } from '../../components/wallets/CreateWalletModal'

export default function DashboardHome() {
  const [timeRange, setTimeRange] = useState('30d')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const navigate = useNavigate()

  /*
    ========================================================
    FETCH WALLETS
    ========================================================
  */

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets')

      console.log('=== WALLETS API ===')
      console.log(res.data)

      return res.data.data.wallets || []
    },
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH ALL TRANSACTIONS
    ========================================================
  */

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/transactions?limit=1000')

      console.log('=== TRANSACTIONS API ===')
      console.log(res.data)

      return res.data.data.transactions || []
    },
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH RECENT TRANSACTIONS
    ========================================================
  */

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/transactions?limit=5')

      console.log('=== RECENT TRANSACTIONS ===')
      console.log(res.data)

      return res.data.data.transactions || []
    },
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH BUDGET SUMMARY
    ========================================================
  */

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/budgets/summary')

      console.log('=== BUDGET SUMMARY ===')
      console.log(res.data)

      return res.data.data
    },
    refetchInterval: 60000
  })

  /*
    ========================================================
    FETCH MONTHLY TREND
    ========================================================
  */

  const { data: monthlyTrend } = useQuery({
    queryKey: ['monthly-trend'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/monthly-trend?months=6')

      console.log('=== MONTHLY TREND ===')
      console.log(res.data)

      return res.data.data
    }
  })

  /*
    ========================================================
    FETCH CATEGORY BREAKDOWN
    ========================================================
  */

  const { data: categoryBreakdown } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/category-breakdown')

      console.log('=== CATEGORY BREAKDOWN ===')
      console.log(res.data)

      return res.data.data
    }
  })

  /*
    ========================================================
    FETCH CATEGORIES
    ========================================================
  */

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories')

      console.log('=== CATEGORIES ===')
      console.log(res.data)

      return res.data.data || []
    }
  })

  /*
    ========================================================
    CALCULATE DASHBOARD STATS
    ========================================================
  */

  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + (wallet.balance || 0),
    0
  )

  const totalIncome = allTransactions
    .filter(
      (transaction) =>
        transaction.type?.toLowerCase() === 'income'
    )
    .reduce(
      (sum, transaction) =>
        sum + (transaction.amount || 0),
      0
    )

  const totalExpenses = allTransactions
    .filter(
      (transaction) =>
        transaction.type?.toLowerCase() === 'expense'
    )
    .reduce(
      (sum, transaction) =>
        sum + (transaction.amount || 0),
      0
    )

  const totalSavings = totalIncome - totalExpenses

  /*
    ========================================================
    FINAL STATS OBJECT
    ========================================================
  */

  const calculatedStats = {
    totalBalance,
    totalIncome,
    totalExpenses,
    totalSavings,

    balanceChange: 0,
    incomeChange: 0,
    expenseChange: 0,
    savingsChange: 0
  }

  /*
    ========================================================
    DEBUG LOGS
    ========================================================
  */

  console.log('=== FINAL DASHBOARD STATS ===')
  console.log(calculatedStats)

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-gray-400 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total Balance"
          value={calculatedStats.totalBalance}
          change={calculatedStats.balanceChange}
          icon={Wallet}
          color="blue"
        />

        <StatCard
          title="Total Income"
          value={calculatedStats.totalIncome}
          change={calculatedStats.incomeChange}
          icon={ArrowUpRight}
          color="green"
        />

        <StatCard
          title="Total Expenses"
          value={calculatedStats.totalExpenses}
          change={calculatedStats.expenseChange}
          icon={ArrowDownRight}
          color="red"
        />

        <StatCard
          title="Savings"
          value={calculatedStats.totalSavings}
          change={calculatedStats.savingsChange}
          icon={TrendingUp}
          color="purple"
        />

      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MONTHLY TREND */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h3 className="text-lg font-semibold text-white mb-4">
            Income vs Expenses
          </h3>

          <ResponsiveContainer width="100%" height={250}>

            <LineChart data={monthlyTrend?.trend || []}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
              />

              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
              />

              <YAxis stroke="#9CA3AF" />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151'
                }}
                labelStyle={{
                  color: '#F3F4F6'
                }}
              />

              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
              />

              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
              />

            </LineChart>

          </ResponsiveContainer>
        </div>

        {/* CATEGORY BREAKDOWN */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h3 className="text-lg font-semibold text-white mb-4">
            Spending by Category
          </h3>

          <ResponsiveContainer width="100%" height={250}>

            <PieChart>

              <Pie
                data={categoryBreakdown?.categories || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="amount"
              >

                {(categoryBreakdown?.categories || []).map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                    />
                  )
                )}

              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151'
                }}
                labelStyle={{
                  color: '#F3F4F6'
                }}
              />

            </PieChart>

          </ResponsiveContainer>

        </div>
      </div>

      {/* BOTTOM SECTION */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* WALLETS */}

        <div className="lg:col-span-2">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <div className="flex items-center justify-between mb-4">

              <h3 className="text-lg font-semibold text-white">
                Wallets
              </h3>

              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />

                Add Wallet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {wallets.slice(0, 4).map((wallet) => (
                <WalletCard
                  key={wallet._id}
                  wallet={wallet}
                />
              ))}

            </div>

          </div>
        </div>

        {/* BUDGETS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between mb-4">

            <h3 className="text-lg font-semibold text-white">
              Budget Status
            </h3>

            {budgetSummary?.alertingCount > 0 && (
              <div className="flex items-center gap-1 text-yellow-400">

                <AlertCircle className="w-4 h-4" />

                <span className="text-sm">
                  {budgetSummary.alertingCount} alerts
                </span>

              </div>
            )}

          </div>

          <div className="space-y-3">

            {budgetSummary?.budgets?.slice(0, 3).map((budget) => (
              <BudgetProgress
                key={budget._id}
                budget={budget}
              />
            ))}

          </div>

        </div>
      </div>

      {/* RECENT TRANSACTIONS */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-semibold text-white">
            Recent Transactions
          </h3>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setShowTransactionForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />

              Add Transaction
            </button>

            <button
              onClick={() => navigate('/dashboard/transactions')}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              View all
            </button>

          </div>
        </div>

        <RecentTransactions
          transactions={recentTransactions}
        />

      </div>

      {/* TRANSACTION MODAL */}

      {showTransactionForm && (
        <TransactionForm
          categories={categories}
          wallets={wallets}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => setShowTransactionForm(false)}
        />
      )}

      {/* WALLET MODAL */}

      {showWalletModal && (
        <CreateWalletModal
          onClose={() => setShowWalletModal(false)}
          onSuccess={() => setShowWalletModal(false)}
        />
      )}

    </div>
  )
}