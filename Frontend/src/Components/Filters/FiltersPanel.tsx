import React from 'react'
import type { DateRangeOption } from '@/features/reports/types'
import { DateRangeFilter } from '@/Components/DateRangeFilter'
import { ReportSelectFilter } from '@/features/reports/components/ReportSelectFilter'

interface FiltersPanelProps {
  selectedDateFilter: DateRangeOption
  customFromDate?: string
  customToDate?: string
  branchFilter?: string
  zoneFilter?: string
  stateFilter?: string
  branchOptions?: string[]
  zoneOptions?: string[]
  stateOptions?: string[]
  onDateFilterChange: (f: DateRangeOption) => void
  onCustomFromDateChange?: (d: string) => void
  onCustomToDateChange?: (d: string) => void
  onBranchFilterChange?: (v: string) => void
  onZoneFilterChange?: (v: string) => void
  onStateFilterChange?: (v: string) => void
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
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
}) => {
  return (
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
    </div>
  )
}

export default FiltersPanel
