import React from 'react'
import { Search, Download, RotateCcw } from 'lucide-react'
import { REPORT_CATEGORIES_CONFIG } from '@/features/reports/constants'

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
    <div className="bg-white rounded-t-xl p-5 border border-[rgba(5,0,88,0.1)] border-b-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
      {/* Title block */}
      <div>
        <h3 className="text-sm font-bold text-[var(--color-navy)]">Report Library</h3>
        <p className="text-[10px] text-[var(--color-ink-muted)] font-semibold">{totalCount} of 24 reports</p>
      </div>

      {/* Filter items */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reports..."
            className="block w-full pl-8 pr-3 py-1.5 bg-[var(--color-ice)] text-[var(--color-navy)] text-xs border border-[rgba(5,0,88,0.12)] rounded-lg placeholder-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-[var(--color-ice)] text-[var(--color-navy)] text-xs border border-[rgba(5,0,88,0.12)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] cursor-pointer transition-colors"
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
          className="bg-[var(--color-ice)] text-[var(--color-navy)] text-xs border border-[rgba(5,0,88,0.12)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] cursor-pointer transition-colors"
        >
          <option value="All">All status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Ready">Ready</option>
          <option value="Failed">Failed</option>
        </select>

        {/* Reset Filters Icon */}
        <button
          onClick={onReset}
          className="p-1.5 bg-[var(--color-ice)] hover:bg-white text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] rounded-lg border border-[rgba(5,0,88,0.12)] cursor-pointer transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Export Action Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 bg-[var(--color-gold)] hover:brightness-95 text-[var(--color-navy)] text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  )
}

export default FilterBar
