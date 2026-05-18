import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'

export function useTransactions() {
  const getTransactions = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.get('/transactions').then(res => res.data.data),
  })

  const createTransaction = useMutation({
    mutationFn: (data) => apiClient.post('/transactions', data),
  })

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/transactions/${id}`, data),
  })

  const deleteTransaction = useMutation({
    mutationFn: (id) => apiClient.delete(`/transactions/${id}`),
  })

  const importCSV = useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post('/transactions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
  })

  return {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importCSV,
  }
}
