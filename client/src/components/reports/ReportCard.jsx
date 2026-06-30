import { motion } from 'framer-motion'
import { FileText, Download, Trash2, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function ReportCard({ report, onDownload, onDelete }) {
  const statusIcons = {
    pending: Clock,
    ready: CheckCircle,
    failed: XCircle
  }

  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-500/10',
    ready: 'text-green-400 bg-green-500/10',
    failed: 'text-red-400 bg-red-500/10'
  }

  const StatusIcon = statusIcons[report.status]

  const typeLabels = {
    monthly: 'Monthly Report',
    yearly: 'Yearly Report',
    wallet: 'Wallet Report',
    category: 'Category Report',
    budget: 'Budget Report'
  }

  const formatLabels = {
    pdf: 'PDF',
    csv: 'CSV'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl card hover:border-border hover:bg-hover transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{typeLabels[report.type]}</h3>
            <p className="text-xs text-muted">{formatLabels[report.format]?.toUpperCase() || 'PDF'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="capitalize">{report.status}</span>
        </div>
      </div>

      {/* Period */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Period</p>
        <p className="text-sm font-medium text-foreground">{report.periodLabel || 'Custom'}</p>
      </div>

      {/* Created At */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Generated</p>
        <p className="text-sm text-muted">
          {report.generatedAt ? dayjs(report.generatedAt).fromNow() : dayjs(report.createdAt).fromNow()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        {report.status === 'ready' ? (
          <button
           onClick={() => onDownload(report)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        ) : report.status === 'pending' ? (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-hover text-muted text-xs font-medium cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Generating...</span>
          </button>
        ) : (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium cursor-not-allowed"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </button>
        )}
        <button
          onClick={() => onDelete(report._id)}
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
