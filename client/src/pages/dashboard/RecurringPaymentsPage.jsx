import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Calendar, DollarSign, AlertCircle, Play, Pause, Trash2, SkipForward, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { formatCurrency } from '../../utils/format'
import { RecurringPaymentForm } from '../../components/recurring/RecurringPaymentForm'
import { RecurringPaymentCard } from '../../components/recurring/RecurringPaymentCard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function RecurringPaymentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all') // all, active, paused, due-soon
  const [frequencyFilter, setFrequencyFilter] = useState('all')

  const queryClient = useQueryClient()

  const { data: recurringPaymentsData, isLoading, refetch } = useQuery({
    queryKey: ['recurring-payments', filter, frequencyFilter],
    queryFn: () => {
      const params = {}
      if (filter === 'active') params.isActive = 'true'
      if (filter === 'paused') params.isActive = 'false'
      if (frequencyFilter !== 'all') params.frequency = frequencyFilter
      
      return apiClient.get('/recurring-payments', { params }).then(res => res.data.data)
    }
  })

  const { data: dueSoonData } = useQuery({
    queryKey: ['recurring-payments-due-soon'],
    queryFn: () => apiClient.get('/recurring-payments/due-soon').then(res => res.data.data),
    refetchInterval: 60000 // Refresh every minute
  })

  const pauseResumeMutation = useMutation({
    mutationFn: ({ id, isActive }) => apiClient.put(`/recurring-payments/${id}/pause`, { isActive }),
    onSuccess: () => {
      toast.success('Recurring payment updated')
      queryClient.invalidateQueries({ queryKey: ['recurring-payments', filter, frequencyFilter] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update recurring payment')
    }
  })

  const markAsPaidMutation = useMutation({
    mutationFn: (id) => apiClient.post(`/recurring-payments/${id}/pay`),
    onSuccess: () => {
      toast.success('Payment marked as paid')
      queryClient.invalidateQueries({ queryKey: ['recurring-payments', filter, frequencyFilter] })
      queryClient.invalidateQueries({ queryKey: ['recurring-payments-due-soon'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark as paid')
    }
  })

  const skipMutation = useMutation({
    mutationFn: (id) => apiClient.post(`/recurring-payments/${id}/skip`),
    onSuccess: () => {
      toast.success('Occurrence skipped')
      queryClient.invalidateQueries({ queryKey: ['recurring-payments', filter, frequencyFilter] })
      queryClient.invalidateQueries({ queryKey: ['recurring-payments-due-soon'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to skip occurrence')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/recurring-payments/${id}`),
    onSuccess: () => {
      toast.success('Recurring payment deleted')
      queryClient.invalidateQueries({ queryKey: ['recurring-payments', filter, frequencyFilter] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete recurring payment')
    }
  })

  const recurringPayments = recurringPaymentsData?.recurringPayments ?? []
  const dueSoonPayments = dueSoonData?.recurringPayments ?? []

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/recurring-payments', data),
    onSuccess: () => {
      toast.success('Recurring payment created')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['recurring-payments', filter, frequencyFilter] })
    },
    onError: (error) => {
      console.error('Create error:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to create recurring payment')
    }
  })

  const handlePauseResume = (id, isActive) => {
    pauseResumeMutation.mutate({ id, isActive })
  }

  const handleMarkAsPaid = (id) => {
    if (window.confirm('Mark this payment as paid? This will create a transaction.')) {
      markAsPaidMutation.mutate(id)
    }
  }

  const handleSkip = (id) => {
    if (window.confirm('Skip this occurrence? The next due date will be updated.')) {
      skipMutation.mutate(id)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this recurring payment? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (payment) => {
    // TODO: Implement edit functionality
    console.log('Edit payment:', payment)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recurring Payments</h1>
              <p className="text-sm text-muted">
                {recurringPayments.length} payment{recurringPayments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary px-4 py-2 text-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      {/* Due Soon Alert */}
      {dueSoonPayments.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-400">
                {dueSoonPayments.length} payment{dueSoonPayments.length !== 1 ? 's' : ''} due soon
              </p>
              <p className="text-xs text-muted">
                {dueSoonPayments.map(p => p.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-hover text-muted hover:bg-hover'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-hover text-muted hover:bg-hover'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === 'paused'
                ? 'bg-primary text-primary-foreground'
                : 'bg-hover text-muted hover:bg-hover'
            }`}
          >
            Paused
          </button>
        </div>
        <div className="h-6 w-px bg-elevated" />
        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg input-field text-sm text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="all">All Frequencies</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Recurring Payments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-4 bg-elevated rounded w-3/4 mb-3" />
              <div className="h-3 bg-elevated rounded w-1/2 mb-4" />
              <div className="h-8 bg-elevated rounded w-full" />
            </div>
          ))}
        </div>
      ) : recurringPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-hover flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No recurring payments</h3>
          <p className="text-sm text-muted mb-4">
            Set up recurring payments to automate your finances
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary px-4 py-2 text-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Payment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringPayments.map((payment) => (
            <RecurringPaymentCard
              key={payment._id}
              payment={payment}
              onPauseResume={handlePauseResume}
              onMarkAsPaid={handleMarkAsPaid}
              onSkip={handleSkip}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <RecurringPaymentForm
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            if (createMutation.isPending) return
            await createMutation.mutateAsync(data)
          }}
        />
      )}
    </div>
  )
}
