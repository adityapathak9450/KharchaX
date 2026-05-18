import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'

export function useAnalytics() {
  const getMonthlyTrend = (months = 6) => useQuery({
    queryKey: ['monthly-trend', months],
    queryFn: () => apiClient.get('/analytics/monthly-trend', { params: { months } }).then(res => res.data.data),
  })

  const getCategoryBreakdown = () => useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => apiClient.get('/analytics/category-breakdown').then(res => res.data.data),
  })

  const getSpendingHeatmap = () => useQuery({
    queryKey: ['spending-heatmap'],
    queryFn: () => apiClient.get('/analytics/spending-heatmap').then(res => res.data.data),
  })

  const getSavingsGrowth = () => useQuery({
    queryKey: ['savings-growth'],
    queryFn: () => apiClient.get('/analytics/savings-growth').then(res => res.data.data),
  })

  const getWalletUsage = () => useQuery({
    queryKey: ['wallet-usage'],
    queryFn: () => apiClient.get('/analytics/wallet-usage').then(res => res.data.data),
  })

  const getTopCategories = () => useQuery({
    queryKey: ['top-categories'],
    queryFn: () => apiClient.get('/analytics/top-categories').then(res => res.data.data),
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
