// PageHeader Component - Renders page title and filter controls for analytics

import React from 'react'
import { RotateCw } from 'lucide-react'
import type { DateRangeOption } from '@/features/reports/types'
import { DateRangeFilter } from '@/features/reports/components/DateRangeFilter'
import { ReportSelectFilter } from '@/features/reports/components/ReportSelectFilter'

interface PageHeaderProps {
  title: string
  subtitle: string
  selectedDateFilter: DateRangeOption
  customFromDate?: string
  customToDate?: string
  branchFilter?: string
  zoneFilter?: string
  stateFilter?: string
  branchOptions?: string[]
  zoneOptions?: string[]
  stateOptions?: string[]
  onDateFilterChange: (filter: DateRangeOption) => void
  onCustomFromDateChange?: (date: string) => void
  onCustomToDateChange?: (date: string) => void
  onBranchFilterChange?: (value: string) => void
  onZoneFilterChange?: (value: string) => void
  onStateFilterChange?: (value: string) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  selectedDateFilter,
  customFromDate = '',
  customToDate = '',
  branchFilter = '',
  zoneFilter = '',
  stateFilter = '',
  branchOptions = [],
  zoneOptions = [],
  stateOptions = [],
  onDateFilterChange,
  onCustomFromDateChange,
  onCustomToDateChange,
  onBranchFilterChange,
  onZoneFilterChange,
  onStateFilterChange,
  onRefresh,
  isRefreshing = false,
  
}) => {
  return (
    <div className="surface-card rounded-xl px-5 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      {/* Title Block */}
      <div>
        <h1 className="text-[24px] font-bold text-[var(--color-navy)] leading-tight">{title}</h1>
        <p className="text-[13px] text-[var(--color-ink-muted)] mt-0.5 font-medium">{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter
          value={selectedDateFilter}
          customFromDate={customFromDate}
          customToDate={customToDate}
          onChange={onDateFilterChange}
          onCustomFromDateChange={onCustomFromDateChange ?? (() => {})}
          onCustomToDateChange={onCustomToDateChange ?? (() => {})}
        />
        
        {onBranchFilterChange && (
          <ReportSelectFilter
            label="Branch"
            value={branchFilter}
            options={branchOptions}
            allLabel="All Branches"
            onChange={onBranchFilterChange}
          />
        )}
        
        {onZoneFilterChange && (
          <ReportSelectFilter
            label="Zone"
            value={zoneFilter}
            options={zoneOptions}
            allLabel="All Zones"
            onChange={onZoneFilterChange}
          />
        )}

        {onStateFilterChange && (
          <ReportSelectFilter
            label="State"
            value={stateFilter}
            options={stateOptions}
            allLabel="All States"
            onChange={onStateFilterChange}
          />
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  )
}

export default PageHeader
