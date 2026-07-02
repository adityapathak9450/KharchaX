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

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";

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
import { useChartTheme } from '../../hooks/useChartTheme'
import { STATUS } from '../../lib/designTokens'

export default function DashboardHome() {
  const [timeRange, setTimeRange] = useState('30d')

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const getMonthsFromRange = (range) => {
    if (range === '7d') return 1
    if (range === '90d') return 3
    if (range === '1y') return 12
    return 6
  }

  const getDateRangeParams = (range) => {
    const endDate = new Date()
    const startDate = new Date()

    if (range === '7d') startDate.setDate(endDate.getDate() - 7)
    else if (range === '90d') startDate.setDate(endDate.getDate() - 90)
    else if (range === '1y') startDate.setFullYear(endDate.getFullYear() - 1)
    else startDate.setDate(endDate.getDate() - 30)

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const navigate = useNavigate()
  const chart = useChartTheme()

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets')
      return res.data.data.wallets || []
    },
    refetchInterval: 30000
  })

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/transactions', {
        params: { limit: 1000, ...getDateRangeParams(timeRange) }
      })
      return res.data.data.transactions || []
    },
    refetchInterval: 30000
  })

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/transactions', {
        params: { limit: 5, ...getDateRangeParams(timeRange) }
      })
      return res.data.data.transactions || []
    },
    refetchInterval: 30000
  })

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/budgets/summary')
      return res.data.data
    },
    refetchInterval: 60000
  })

  const { data: monthlyTrend } = useQuery({
    queryKey: ['monthly-trend', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/monthly-trend', {
        params: { range: timeRange, months: getMonthsFromRange(timeRange) }
      })
      return res.data.data
    }
  })

  const { data: categoryBreakdown } = useQuery({
    queryKey: ['category-breakdown', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/category-breakdown', {
        params: { range: timeRange }
      })
      return res.data.data
    }
  })

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/dashboard-stats', {
        params: { range: timeRange }
      })
      return res.data.data?.stats
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories')
      return res.data.data || []
    }
  })

  const totalBalance = dashboardStats?.totalBalance ?? wallets.reduce(
    (sum, wallet) => sum + (wallet.balance || 0),
    0
  )
  const totalIncome = dashboardStats?.totalIncome ?? 0
  const totalExpenses = dashboardStats?.totalExpenses ?? 0
  const totalSavings = dashboardStats?.totalSavings ?? (totalIncome - totalExpenses)

  const calculatedStats = {
    totalBalance,
    totalIncome,
    totalExpenses,
    totalSavings,
    balanceChange: dashboardStats?.balanceChange ?? 0,
    incomeChange: dashboardStats?.incomeChange ?? 0,
    expenseChange: dashboardStats?.expenseChange ?? 0,
    savingsChange: dashboardStats?.savingsChange ?? 0
  }

  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-0">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>

          <p className="text-muted mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>

        <div className="w-full sm:w-44">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard title="Total Balance" value={calculatedStats.totalBalance} change={calculatedStats.balanceChange} icon={Wallet} color="blue" />
        <StatCard title="Total Income" value={calculatedStats.totalIncome} change={calculatedStats.incomeChange} icon={ArrowUpRight} color="green" />
        <StatCard title="Total Expenses" value={calculatedStats.totalExpenses} change={calculatedStats.expenseChange} icon={ArrowDownRight} color="red" />
        <StatCard title="Savings" value={calculatedStats.totalSavings} change={calculatedStats.savingsChange} icon={TrendingUp} color="purple" />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="card p-4 sm:p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">
            Income vs Expenses
          </h3>

          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <LineChart data={monthlyTrend?.trend || []}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="month" {...chart.axisProps} />
              <YAxis {...chart.yAxisProps} />
              <Tooltip {...chart.tooltipProps} />

              <Line type="monotone" dataKey="income" stroke={STATUS.income} strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke={STATUS.expense} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 sm:p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">
            Spending by Category
          </h3>

          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <PieChart>
              <Pie
                data={categoryBreakdown?.categories || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="amount"
              >
                {(categoryBreakdown?.categories || []).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip {...chart.tooltipProps} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* WALLET + BUDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <div className="lg:col-span-2">
          <div className="card p-6">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Wallets</h3>

              <button
                onClick={() => setShowWalletModal(true)}
                className="btn-primary px-2 sm:px-3 py-2 text-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Wallet
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wallets.slice(0, 4).map((wallet) => (
                <WalletCard key={wallet._id} wallet={wallet} />
              ))}
            </div>

          </div>
        </div>

        <div className="card p-6">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Budget Status</h3>

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
              <BudgetProgress key={budget._id} budget={budget} />
            ))}
          </div>

        </div>

      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="card p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <h3 className="text-lg font-semibold">Recent Transactions</h3>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setShowTransactionForm(true)}
              className="btn-primary px-3 py-2 text-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>

            <button
              onClick={() => navigate('/dashboard/transactions')}
              className="text-primary text-sm"
            >
              View all
            </button>

          </div>
        </div>

        <RecentTransactions transactions={recentTransactions} />

      </div>

      {/* MODALS */}
      {showTransactionForm && (
        <TransactionForm
          categories={categories}
          wallets={wallets}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => setShowTransactionForm(false)}
        />
      )}

      {showWalletModal && (
        <CreateWalletModal
          onClose={() => setShowWalletModal(false)}
          onSuccess={() => setShowWalletModal(false)}
        />
      )}

    </div>
  )
}