import React from 'react'
import { Search, Download, RotateCcw } from 'lucide-react'
import { REPORT_CATEGORIES_CONFIG } from '../../constants'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  totalCount: number
  onExport: () => void
  onReset: () => void
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  totalCount,
  onExport,
  onReset
}) => {
  return (
    <div className="bg-white rounded-t-xl p-5 border border-slate-100 border-b-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
      {/* Title block */}
      <div>
        <h3 className="text-sm font-bold text-slate-800">Report Library</h3>
        <p className="text-[10px] text-slate-400 font-semibold">{totalCount} of 24 reports</p>
      </div>

      {/* Filter items */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reports..."
            className="block w-full pl-8 pr-3 py-1.5 bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
        >
          <option value="All">All categories</option>
          {REPORT_CATEGORIES_CONFIG.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
        >
          <option value="All">All status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Ready">Ready</option>
          <option value="Failed">Failed</option>
        </select>

        {/* Reset Filters Icon */}
        <button
          onClick={onReset}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 cursor-pointer transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Export Action Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-905 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm text-slate-950"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  )
}
export default FilterBar
