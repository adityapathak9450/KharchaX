import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  TrendingDown as TrendingDownIcon
} from 'lucide-react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    console.log('[analytics] selectedRange changed:', timeRange)
  }, [timeRange])

  /*
    ========================================================
    FETCH MONTHLY TREND (OPTIMIZED)
    ========================================================
  */

  const { data: monthlyTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['monthly-trend', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/monthly-trend', {
        params: { range: timeRange }
      })
      console.log('=== MONTHLY TREND API RESPONSE ===')
      console.log('RESPONSE DATA:', res.data)
      console.log('TREND DATA:', res.data.data?.trend)
      
      // Return ONLY real database data - NO STATIC FALLBACKS
      return res.data.data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH CATEGORY BREAKDOWN (OPTIMIZED)
    ========================================================
  */

  const { data: categoryBreakdown, isLoading: categoryLoading } = useQuery({
    queryKey: ['category-breakdown', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/category-breakdown', {
        params: { range: timeRange }
      })
      console.log('=== CATEGORY BREAKDOWN API RESPONSE ===')
      console.log('RESPONSE DATA:', res.data)
      console.log('CATEGORIES DATA:', res.data.data?.categories)
      
      // Return ONLY real database data - NO STATIC FALLBACKS
      return res.data.data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH WALLET USAGE (OPTIMIZED)
    ========================================================
  */

  const { data: walletUsage, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-usage', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/wallet-usage', {
        params: { range: timeRange }
      })
      console.log('=== WALLET USAGE API RESPONSE ===')
      console.log('RESPONSE DATA:', res.data)
      console.log('WALLET STATS:', res.data.data?.walletStats)
      
      // Return ONLY real database data - NO STATIC FALLBACKS
      return res.data.data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH SAVINGS GROWTH (OPTIMIZED)
    ========================================================
  */

  const { data: savingsGrowth, isLoading: savingsLoading } = useQuery({
    queryKey: ['savings-growth', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/savings-growth', {
        params: { range: timeRange }
      })
      console.log('=== SAVINGS GROWTH API RESPONSE ===')
      console.log('RESPONSE DATA:', res.data)
      console.log('GROWTH DATA:', res.data.data?.growth)
      
      // Return ONLY real database data - NO STATIC FALLBACKS
      return res.data.data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  })

  /*
    ========================================================
    FETCH TOP CATEGORIES (OPTIMIZED)
    ========================================================
  */

  const { data: topCategories, isLoading: topLoading } = useQuery({
    queryKey: ['top-categories', timeRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/top-categories', {
        params: { range: timeRange }
      })
      console.log('=== TOP CATEGORIES API RESPONSE ===')
      console.log('RESPONSE DATA:', res.data)
      console.log('CATEGORIES DATA:', res.data.data?.categories)
      
      // Return ONLY real database data - NO STATIC FALLBACKS
      return res.data.data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  })

  // Loading state
  const isLoading = trendLoading || categoryLoading || walletLoading || savingsLoading || topLoading

  // Auto-invalidate queries for real-time updates
  const queryClient = useQueryClient()
  
  const refreshAllCharts = () => {
    console.log('REFRESHING ALL CHARTS FOR REAL-TIME UPDATES')
    queryClient.invalidateQueries(['monthly-trend'])
    queryClient.invalidateQueries(['category-breakdown'])
    queryClient.invalidateQueries(['wallet-usage'])
    queryClient.invalidateQueries(['savings-growth'])
    queryClient.invalidateQueries(['top-categories'])
    queryClient.invalidateQueries(['all-transactions'])
    queryClient.invalidateQueries(['wallets'])
    queryClient.invalidateQueries(['recent-transactions'])
  }

  const rangeLabelMap = {
    '7d': 'last-7-days',
    '30d': 'last-30-days',
    '90d': 'last-90-days',
    '1y': 'last-year',
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      console.log('[analytics] export triggered for range:', timeRange)
      const response = await apiClient.get('/analytics/export', {
        params: { range: timeRange },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${rangeLabelMap[timeRange] || timeRange}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Analytics exported successfully')
    } catch (error) {
      console.error('[analytics] export failed:', error)
      toast.error(error.response?.data?.message || 'Failed to export analytics')
    } finally {
      setIsExporting(false)
    }
  }

  // =========================
  // SUMMARY (SAFE CALCULATIONS)
  // =========================

  const totalIncome =
    monthlyTrend?.trend?.reduce(
      (sum, item) => sum + (item.income || 0),
      0
    ) || 0

  const totalExpenses =
    monthlyTrend?.trend?.reduce(
      (sum, item) => sum + (item.expenses || 0),
      0
    ) || 0

  const totalSavings = totalIncome - totalExpenses
  const savingsRate =
    totalIncome > 0
      ? (totalSavings / totalIncome) * 100
      : 0

  // =========================
  // LIVE DEBUGGING LOGS
  // =========================

  console.log('=== FRONTEND CHART RENDERING DEBUG ===')
  console.log('MONTHLY TREND DATA:', monthlyTrend?.trend)
  console.log('CATEGORY BREAKDOWN DATA:', categoryBreakdown?.categories)
  console.log('WALLET USAGE DATA:', walletUsage?.walletStats)
  console.log('SAVINGS GROWTH DATA:', savingsGrowth?.growth)
  console.log('TOP CATEGORIES DATA:', topCategories?.categories)
  console.log('TOTAL INCOME CALCULATED:', totalIncome)
  console.log('TOTAL EXPENSES CALCULATED:', totalExpenses)
  console.log('TOTAL SAVINGS CALCULATED:', totalSavings)

  const COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#14b8a6',
    '#06b6d4'
  ]

  // =========================
  // SKELETON LOADER COMPONENT
  // =========================

  const SkeletonLoader = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-8 bg-white/10 rounded w-32"></div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="animate-pulse">
              <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
              <div className="h-[300px] bg-white/5 rounded"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Show skeleton loader while loading
  if (isLoading) {
    return <SkeletonLoader />
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      {/* HEADER */}

      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Analytics
          </h1>

          <p className="text-gray-400 mt-1">
            Deep insights into your financial patterns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-44">
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

          <motion.button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </motion.button>
        </div>
      </motion.div>

      {/* SUMMARY CARDS */}

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >

        <motion.div 
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 40px rgba(16, 185, 129, 0.2)"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">
              Total Income
            </p>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>

          <p className="text-2xl font-bold text-green-400 mt-2">
            {formatCurrency(totalIncome)}
          </p>
        </motion.div>

        <motion.div 
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 40px rgba(239, 68, 68, 0.2)"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">
              Total Expenses
            </p>
            <TrendingDownIcon className="w-4 h-4 text-red-400" />
          </div>

          <p className="text-2xl font-bold text-red-400 mt-2">
            {formatCurrency(totalExpenses)}
          </p>
        </motion.div>

        <motion.div 
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 40px rgba(59, 130, 246, 0.2)"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">
              Net Savings
            </p>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>

          <p className="text-2xl font-bold text-blue-400 mt-2">
            {formatCurrency(totalSavings)}
          </p>
        </motion.div>

        <motion.div 
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 40px rgba(139, 92, 246, 0.2)"
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">
              Savings Rate
            </p>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>

          <p className="text-2xl font-bold text-purple-400 mt-2">
            {savingsRate.toFixed(1)}%
          </p>
        </motion.div>

      </motion.div>

      {/* MAIN CHARTS */}

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* TREND */}

      <motion.div 
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2 hover:bg-white/[0.05] transition-all duration-300"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Income vs Expenses
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-400">Income</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-400">Expenses</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={monthlyTrend?.trend || []}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >

              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                strokeOpacity={0.3}
              />

              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#374151' }}
              />

              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#374151' }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />

              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#incomeGradient)"
                fillOpacity={0.6}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />

              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={3}
                fill="url(#expensesGradient)"
                fillOpacity={0.6}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>

      </motion.div>

      {/* CATEGORY PIE */}

      <motion.div 
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Spending by Category
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>

              <Pie
                data={categoryBreakdown?.categories || []}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {(categoryBreakdown?.categories || []).map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.color ||
                        COLORS[index % COLORS.length]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />

            </RePieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* TOP CATEGORIES */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h3 className="text-lg font-semibold text-white mb-4">
            Top Categories
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCategories?.categories || []}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
              />

              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
              />

              <YAxis stroke="#9CA3AF" />

              <Tooltip />

              <Bar
                dataKey="amount"
                fill="#6366f1"
              />

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* WALLET USAGE */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h3 className="text-lg font-semibold text-white mb-4">
            Wallet Usage
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={walletUsage?.walletStats || []}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
              />

              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
              />

              <YAxis stroke="#9CA3AF" />

              <Tooltip />

              <Bar
                dataKey="income"
                fill="#10B981"
              />

              <Bar
                dataKey="expenses"
                fill="#EF4444"
              />

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SAVINGS GROWTH */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h3 className="text-lg font-semibold text-white mb-4">
            Savings Growth
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={savingsGrowth?.growth || []}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
              />

              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
              />

              <YAxis stroke="#9CA3AF" />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="savings"
                stroke="#6366f1"
                strokeWidth={2}
              />

              <Line
                type="monotone"
                dataKey="cumulativeSavings"
                stroke="#10B981"
                strokeWidth={2}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </div>

    </motion.div>
  )
}