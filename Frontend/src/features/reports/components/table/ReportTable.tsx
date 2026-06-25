import React from 'react'
import { Eye, Download, MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReportItem, FilterState } from '../../types'
import { exportReportRowToExcel } from '../../utils/excelExport'

interface ReportTableProps {
  reports: ReportItem[]
  total: number
  filters: FilterState
  isLoading: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSortChange: (column: keyof ReportItem) => void
  onViewReport: (report: ReportItem) => void
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  total,
  filters,
  isLoading,
  onPageChange,
  onLimitChange,
  onSortChange,
  onViewReport
}) => {
  const totalPages = Math.ceil(total / filters.limit)

  const handleDownloadRow = (e: React.MouseEvent, report: ReportItem) => {
    e.stopPropagation()
    exportReportRowToExcel(report)
  }

  // Helper to determine status badges
  const renderStatusBadge = (status: string) => {
    let style = ''
    switch (status) {
      case 'Ready':
        style = 'bg-emerald-50 text-emerald-600 border-emerald-100'
        break
      case 'Failed':
        style = 'bg-rose-50 text-rose-600 border-rose-100'
        break
      default:
        style = 'bg-blue-50 text-blue-600 border-blue-100'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${style}`}>
        <span className={`w-1 h-1 rounded-full ${status === 'Ready' ? 'bg-emerald-500' : status === 'Failed' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
        {status}
      </span>
    )
  }

  const renderSortIcon = (columnName: keyof ReportItem) => {
    if (filters.sortBy === columnName) {
      return (
        <ArrowUpDown className={`w-3 h-3 transition-colors ${filters.sortOrder === 'asc' ? 'text-indigo-650' : 'text-indigo-800'}`} />
      )
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
  }

  return (
    <div className="bg-white border border-slate-100 rounded-b-xl shadow-sm overflow-hidden select-none">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-y border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {/* Report Name Header */}
              <th
                onClick={() => onSortChange('name')}
                className="py-3 px-5 cursor-pointer group select-none hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Report Name</span>
                  {renderSortIcon('name')}
                </div>
              </th>

              {/* Category Header */}
              <th
                onClick={() => onSortChange('category')}
                className="py-3 px-5 cursor-pointer group select-none hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Category</span>
                  {renderSortIcon('category')}
                </div>
              </th>

              {/* Created By Header */}
              <th
                onClick={() => onSortChange('createdBy')}
                className="py-3 px-5 cursor-pointer group select-none hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Created By</span>
                  {renderSortIcon('createdBy')}
                </div>
              </th>

              {/* Created Date Header */}
              <th
                onClick={() => onSortChange('createdDate')}
                className="py-3 px-5 cursor-pointer group select-none hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Created Date</span>
                  {renderSortIcon('createdDate')}
                </div>
              </th>

              {/* Status Header */}
              <th
                onClick={() => onSortChange('status')}
                className="py-3 px-5 cursor-pointer group select-none hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              {/* Actions Header */}
              <th className="py-3 px-5 text-right font-bold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[12px] text-slate-700">
            {isLoading ? (
              // Loading State Shimmers
              [...Array(filters.limit)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4.5 px-5">
                    <div className="h-4 bg-slate-100 rounded w-48 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="py-4.5 px-5"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                  <td className="py-4.5 px-5"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                  <td className="py-4.5 px-5"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                  <td className="py-4.5 px-5"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                  <td className="py-4.5 px-5"><div className="h-4 bg-slate-100 rounded w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 select-none font-medium">
                  No matching reports found inside this segment.
                </td>
              </tr>
            ) : (
              // Row Rendering
              reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => onViewReport(report)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  {/* Name and ID */}
                  <td className="py-4 px-5">
                    <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {report.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">{report.id}</div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-5 text-slate-500 font-medium">
                    {report.category}
                  </td>

                  {/* Created By */}
                  <td className="py-4 px-5 text-slate-600 font-medium">
                    {report.createdBy}
                  </td>

                  {/* Created Date */}
                  <td className="py-4 px-5 text-slate-500 font-medium">
                    {report.createdDate}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">{renderStatusBadge(report.status)}</td>

                  {/* Action Icons */}
                  <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Eye */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewReport(report)
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        title="View Report SQL Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Download */}
                      {report.status !== 'Failed' && (
                        <button
                          onClick={(e) => handleDownloadRow(e, report)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                          title="Download Report Data"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* More Ellipsis */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        {/* Page size limit changer */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Show</span>
          <select
            value={filters.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={15}>15 rows</option>
            <option value={20}>20 rows</option>
          </select>
          <span>of {total} entries</span>
        </div>

        {/* Page Nav Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 text-xs">
            {/* Prev button */}
            <button
              onClick={() => onPageChange(Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              className="p-1.5 border border-slate-200 text-slate-500 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Numbers */}
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNum = idx + 1
              const isActive = filters.page === pageNum
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, filters.page + 1))}
              disabled={filters.page === totalPages}
              className="p-1.5 border border-slate-200 text-slate-500 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
export default ReportTable
