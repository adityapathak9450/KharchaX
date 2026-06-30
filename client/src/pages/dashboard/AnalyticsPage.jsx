import React, { useCallback } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
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
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useChartTheme } from '../../hooks/useChartTheme'
import { CHART_COLORS, STATUS } from '../../lib/designTokens'

// ─── helpers ────────────────────────────────────────────────────────────────

const RANGE_LABELS = {
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y':  'Last year',
}

const FILE_LABELS = {
  '7d':  'last-7-days',
  '30d': 'last-30-days',
  '90d': 'last-90-days',
  '1y':  'last-year',
}

function CardSkeleton() {
  return (
    <div className="card p-6">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-36" />
    </div>
  )
}

function ChartSkeleton({ height = 300 }) {
  return (
    <div
      className="skeleton rounded-xl flex items-center justify-center"
      style={{ height }}
    >
      <BarChart3 className="h-8 w-8 text-muted/30" />
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [timeRange, setTimeRange]   = useState('30d')
  const [isExporting, setIsExporting] = useState(false)
  const queryClient = useQueryClient()
  const chart = useChartTheme()

  // shared fetch helper — always fresh, keyed by timeRange
  const fetchAnalytics = useCallback(
    (path) => (range) =>
      apiClient
        .get(path, { params: { range } })
        .then((res) => res.data.data),
    []
  )

  const queryOpts = (key, path) => ({
    queryKey: [key, timeRange],
    queryFn:  () => fetchAnalytics(path)(timeRange),
    // ← CRITICAL: no staleTime / cacheTime so every range change hits the server
    staleTime: 0,
    gcTime:    0,
    refetchOnWindowFocus: false,
  })

  const { data: trendData,    isLoading: trendLoading    } = useQuery(queryOpts('monthly-trend',       '/analytics/monthly-trend'))
  const { data: categoryData, isLoading: categoryLoading } = useQuery(queryOpts('category-breakdown',  '/analytics/category-breakdown'))
  const { data: walletData,   isLoading: walletLoading   } = useQuery(queryOpts('wallet-usage',        '/analytics/wallet-usage'))
  const { data: savingsData,  isLoading: savingsLoading  } = useQuery(queryOpts('savings-growth',      '/analytics/savings-growth'))
  const { data: topData,      isLoading: topLoading      } = useQuery(queryOpts('top-categories',      '/analytics/top-categories'))

  // ── summaries (from trend data) ────────────────────────────────────────────
  const trend      = trendData?.trend      || []
  const categories = categoryData?.categories || []
  const wallets    = walletData?.walletStats  || []
  const growth     = savingsData?.growth      || []
  const topCats    = topData?.categories      || []

  const totalIncome   = trend.reduce((s, i) => s + (i.income   || 0), 0)
  const totalExpenses = trend.reduce((s, i) => s + (i.expenses || 0), 0)
  const totalSavings  = totalIncome - totalExpenses
  const savingsRate   = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  // ── range change: invalidate everything ───────────────────────────────────
  const handleRangeChange = (val) => {
    setTimeRange(val)
    // Flush cached data for all analytics keys so charts re-render fresh
    ;['monthly-trend','category-breakdown','wallet-usage','savings-growth','top-categories']
      .forEach((k) => queryClient.removeQueries({ queryKey: [k] }))
  }

  // ── export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await apiClient.get('/analytics/export', {
        params: { range: timeRange },
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${FILE_LABELS[timeRange] || timeRange}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Analytics exported successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export analytics')
    } finally {
      setIsExporting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted mt-1">Deep insights into your financial patterns</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select value={timeRange} onValueChange={handleRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RANGE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-hover shadow-sm transition-colors disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {trendLoading ? (
          [1,2,3,4].map(i => <CardSkeleton key={i} />)
        ) : (
          <>
            <SummaryCard
              label="Total Income"
              value={formatCurrency(totalIncome)}
              icon={<TrendingUp className="w-4 h-4 text-green-400" />}
              color="text-green-400"
              glow="rgba(16,185,129,0.2)"
            />
            <SummaryCard
              label="Total Expenses"
              value={formatCurrency(totalExpenses)}
              icon={<TrendingDown className="w-4 h-4 text-red-400" />}
              color="text-red-400"
              glow="rgba(239,68,68,0.2)"
            />
            <SummaryCard
              label="Net Savings"
              value={formatCurrency(totalSavings)}
              icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
              color="text-blue-400"
              glow="rgba(59,130,246,0.2)"
            />
            <SummaryCard
              label="Savings Rate"
              value={`${savingsRate.toFixed(1)}%`}
              icon={<PieChart className="w-4 h-4 text-purple-400" />}
              color="text-purple-400"
              glow="rgba(139,92,246,0.2)"
            />
          </>
        )}
      </div>

      {/* ── Charts Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Income vs Expenses — full width */}
        <ChartCard
          title="Income vs Expenses"
          span2
          loading={trendLoading}
          legend={[
            { color: STATUS.income, label: 'Income' },
            { color: STATUS.expense, label: 'Expenses' },
          ]}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={STATUS.income} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={STATUS.income} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={STATUS.expense} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={STATUS.expense} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="month" {...chart.axisProps} />
              <YAxis {...chart.yAxisProps} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip {...chart.tooltipProps} formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="income"   stroke={STATUS.income} strokeWidth={2} fill="url(#incG)" />
              <Area type="monotone" dataKey="expenses" stroke={STATUS.expense} strokeWidth={2} fill="url(#expG)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Spending by Category — pie */}
        <ChartCard title="Spending by Category" loading={categoryLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={categories}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categories.map((entry, i) => (
                  <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...chart.tooltipProps} formatter={(v) => formatCurrency(v)} />
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Categories — bar */}
        <ChartCard title="Top Spending Categories" loading={topLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="name" {...chart.axisProps} />
              <YAxis {...chart.yAxisProps} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip {...chart.tooltipProps} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {topCats.map((entry, i) => (
                  <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Wallet Usage — grouped bar */}
        <ChartCard
          title="Wallet Usage"
          loading={walletLoading}
          legend={[
            { color: STATUS.income, label: 'Income' },
            { color: STATUS.expense, label: 'Expenses' },
          ]}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wallets} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="name" {...chart.axisProps} />
              <YAxis {...chart.yAxisProps} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip {...chart.tooltipProps} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="income"   fill={STATUS.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill={STATUS.expense} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Savings Growth — line, full width */}
        <ChartCard
          title="Savings Growth"
          span2
          loading={savingsLoading}
          legend={[
            { color: STATUS.savings, label: 'Savings' },
            { color: STATUS.income, label: 'Cumulative' },
          ]}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="month" {...chart.axisProps} />
              <YAxis {...chart.yAxisProps} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip {...chart.tooltipProps} formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="savings"           stroke={STATUS.savings} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cumulativeSavings" stroke={STATUS.income} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </motion.div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color, glow }) {
  return (
    <motion.div
      className="card-interactive p-6"
      whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${glow}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
    </motion.div>
  )
}

function ChartCard({ title, children, loading, span2, legend }) {
  return (
    <motion.div
      className={`card-interactive p-6 ${span2 ? 'lg:col-span-2' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {legend && (
          <div className="flex items-center gap-3">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-muted">{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {loading ? <ChartSkeleton /> : children}
    </motion.div>
  )
}
