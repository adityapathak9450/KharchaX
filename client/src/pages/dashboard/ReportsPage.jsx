import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Download, Trash2, Clock, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { ReportForm } from '../../components/reports/ReportForm'
import { ReportCard } from '../../components/reports/ReportCard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function ReportsPage() {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const queryClient = useQueryClient()

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => apiClient.get('/reports').then(res => res.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/reports/${id}`),
    onSuccess: () => {
      toast.success('Report deleted')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete report')
    }
  })

  const filteredReports = reports?.filter(report => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false
    if (typeFilter !== 'all' && report.type !== typeFilter) return false
    return true
  }) ?? []

  const handleDelete = (id) => {
    if (window.confirm('Delete this report?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reports</h1>
              <p className="text-sm text-gray-400">
                {reports?.length || 0} report{reports?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">Filter:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50"
        >
          <option value="all">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="wallet">Wallet</option>
          <option value="category">Category</option>
          <option value="budget">Budget</option>
        </select>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-8 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No reports</h3>
          <p className="text-sm text-gray-500 mb-4">
            Generate your first report to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ReportForm
          onClose={() => setShowForm(false)}
          onSubmit={() => {
            setShowForm(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
