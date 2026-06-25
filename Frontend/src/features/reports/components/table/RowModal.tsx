import React from 'react'
import { X, Copy, Check, Calendar, HardDrive, Database, Info, FileCode } from 'lucide-react'
import { ReportItem } from '../../types'
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
      case 'Failed':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(report.status)}`}>
                {report.status}
              </span>
              <span className="text-[11px] font-bold text-slate-400">{report.id}</span>
            </div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
              {report.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Description Section */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg space-y-1 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 text-xs font-bold select-none">
              <Info className="w-3.5 h-3.5" />
              <span>Description</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 font-medium leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Report Config Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Category</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block truncate">
                {report.category}
              </span>
            </div>

            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Created By</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                {report.createdBy}
              </span>
            </div>

            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Date Created</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                {report.createdDate}
              </span>
            </div>

            <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1 select-none">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">File Size</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                {report.fileSize}
              </span>
            </div>
          </div>

          {/* Details Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Schedule */}
            <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg flex items-start gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-lg shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Report Schedule</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {report.cronExpression}
                </span>
              </div>
            </div>

            {/* Records */}
            <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg flex items-start gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 rounded-lg shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Database Records</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {report.recordCount.toLocaleString()} Rows
                </span>
              </div>
            </div>
          </div>

          {/* SQL Query block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 text-xs font-bold">
                <Database className="w-3.5 h-3.5" />
                <span>Source SQL Query Statement</span>
              </div>
              <button
                onClick={handleCopyQuery}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Query'}</span>
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-900/90 text-indigo-200 font-mono text-[10.5px] p-4 overflow-x-auto leading-relaxed whitespace-pre scrollbar-thin max-h-48">
                {report.sqlQuery}
              </div>
              <div className="absolute top-2 right-2 bg-slate-900/60 text-slate-450 p-1.5 rounded pointer-events-none">
                <FileCode className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
export default RowModal
