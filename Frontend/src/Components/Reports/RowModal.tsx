import React from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Check, Calendar, HardDrive, Database, Info, FileCode } from 'lucide-react'
import { ReportItem } from '@/features/reports/types'
import { toast } from 'sonner'

interface RowModalProps {
  report: ReportItem | null
  isOpen: boolean
  onClose: () => void
}

export const RowModal: React.FC<RowModalProps> = ({ report, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false)

  if (!isOpen || !report) return null

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(report.sqlQuery)
    setCopied(true)
    toast.success('SQL query copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Get status color mappings
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-[rgba(206,155,1,0.14)] text-[var(--color-gold)] border-[rgba(206,155,1,0.24)]'
      case 'Failed':
        return 'bg-[var(--color-ice)] text-[var(--color-blue)] border-[rgba(0,1,130,0.14)]'
      default:
        return 'bg-[var(--color-ice)] text-[var(--color-navy)] border-[rgba(5,0,88,0.12)]'
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[rgba(5,0,88,0.62)] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-xl max-w-2xl w-full border border-[rgba(5,0,88,0.12)] shadow-2xl overflow-hidden animate-fade-in z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[rgba(5,0,88,0.08)] select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(report.status)}`}>
                {report.status}
              </span>
              <span className="text-[11px] font-bold text-[var(--color-ink-muted)]">{report.id}</span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-navy)]">
              {report.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-ice)] text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Description Section */}
          <div className="bg-[var(--color-ice)] p-4 rounded-lg space-y-1 border border-[rgba(5,0,88,0.08)]">
            <div className="flex items-center gap-1.5 text-[var(--color-blue)] text-xs font-bold select-none">
              <Info className="w-3.5 h-3.5" />
              <span>Description</span>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] font-medium leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Report Config Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 border border-[rgba(5,0,88,0.12)] rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-[var(--color-ink-muted)] font-bold block uppercase">Category</span>
              <span className="text-xs font-semibold text-[var(--color-navy)] block truncate">
                {report.category}
              </span>
            </div>

            <div className="p-3 border border-[rgba(5,0,88,0.12)] rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-[var(--color-ink-muted)] font-bold block uppercase">Created By</span>
              <span className="text-xs font-semibold text-[var(--color-navy)] block">
                {report.createdBy}
              </span>
            </div>

            <div className="p-3 border border-[rgba(5,0,88,0.12)] rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-[var(--color-ink-muted)] font-bold block uppercase">Date Created</span>
              <span className="text-xs font-semibold text-[var(--color-navy)] block">
                {report.createdDate}
              </span>
            </div>

            <div className="p-3 border border-[rgba(5,0,88,0.12)] rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-[var(--color-ink-muted)] font-bold block uppercase">File Size</span>
              <span className="text-xs font-semibold text-[var(--color-navy)] block">
                {report.fileSize}
              </span>
            </div>
          </div>

          {/* Details Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Schedule */}
            <div className="p-4 border border-[rgba(5,0,88,0.12)] rounded-lg flex items-start gap-3">
              <div className="p-2 bg-[var(--color-ice)] text-[var(--color-blue)] rounded-lg shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[var(--color-ink-muted)] font-bold block uppercase">Report Schedule</span>
                <span className="text-xs font-bold text-[var(--color-navy)]">
                  {report.cronExpression}
                </span>
              </div>
            </div>

            {/* Records */}
            <div className="p-4 border border-[rgba(5,0,88,0.12)] rounded-lg flex items-start gap-3">
              <div className="p-2 bg-[rgba(206,155,1,0.13)] text-[var(--color-gold)] rounded-lg shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[var(--color-ink-muted)] font-bold block uppercase">Database Records</span>
                <span className="text-xs font-bold text-[var(--color-navy)]">
                  {report.recordCount.toLocaleString()} Rows
                </span>
              </div>
            </div>
          </div>

          {/* SQL Query block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5 text-[var(--color-blue)] text-xs font-bold">
                <Database className="w-3.5 h-3.5" />
                <span>Source SQL Query Statement</span>
              </div>
              <button
                onClick={handleCopyQuery}
                className="flex items-center gap-1 text-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] font-semibold bg-[var(--color-ice)] border border-[rgba(5,0,88,0.12)] px-2 py-1 rounded cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[var(--color-gold)]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Query'}</span>
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-[rgba(5,0,88,0.12)]">
              <div className="bg-[var(--color-ice)] text-[var(--color-navy)] font-mono text-[10.5px] p-4 overflow-x-auto leading-relaxed whitespace-pre scrollbar-thin max-h-48 border border-[rgba(5,0,88,0.08)]">
                {report.sqlQuery}
              </div>
              <div className="absolute top-2 right-2 bg-white/70 text-[var(--color-ink-muted)] p-1.5 rounded pointer-events-none">
                <FileCode className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(5,0,88,0.08)] bg-[var(--color-ice)] flex justify-end select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-navy)] hover:bg-[var(--color-blue)] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default RowModal
