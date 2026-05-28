import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'

export function useAnalytics() {
  const getMonthlyTrend = (range = '30d', months = 6) => useQuery({
    queryKey: ['monthly-trend', range, months],
    queryFn: () => apiClient.get('/analytics/monthly-trend', { params: { range, months } }).then(res => res.data.data),
  })

  const getCategoryBreakdown = (range = '30d') => useQuery({
    queryKey: ['category-breakdown', range],
    queryFn: () => apiClient.get('/analytics/category-breakdown', { params: { range } }).then(res => res.data.data),
  })

  const getSpendingHeatmap = () => useQuery({
    queryKey: ['spending-heatmap'],
    queryFn: () => apiClient.get('/analytics/spending-heatmap').then(res => res.data.data),
  })

  const getSavingsGrowth = (range = '30d') => useQuery({
    queryKey: ['savings-growth', range],
    queryFn: () => apiClient.get('/analytics/savings-growth', { params: { range } }).then(res => res.data.data),
  })

  const getWalletUsage = (range = '30d') => useQuery({
    queryKey: ['wallet-usage', range],
    queryFn: () => apiClient.get('/analytics/wallet-usage', { params: { range } }).then(res => res.data.data),
  })

  const getTopCategories = (range = '30d') => useQuery({
    queryKey: ['top-categories', range],
    queryFn: () => apiClient.get('/analytics/top-categories', { params: { range } }).then(res => res.data.data),
  })

  return {
    getMonthlyTrend,
    getCategoryBreakdown,
    getSpendingHeatmap,
    getSavingsGrowth,
    getWalletUsage,
    getTopCategories,
  }
}
