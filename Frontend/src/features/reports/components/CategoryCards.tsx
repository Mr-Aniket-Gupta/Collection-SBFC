import React from 'react'
import { RotateCw } from 'lucide-react'
import type { ReportTableKey } from '../hooks/useReports'
import type { MisCardMetric } from '../utils/misCardMetrics'
import { DateRangeFilter } from './DateRangeFilter'
import { ReportSelectFilter } from './ReportSelectFilter'
import type { DateRangeOption } from '../types'

export interface CategoryCardConfig {
  id: string
  title: string
  tableKey: ReportTableKey
  icon: React.ReactNode
  accent: string
  iconBg: string
}

interface CategoryCardsProps {
  cards: CategoryCardConfig[]
  selectedCategory: string
  categoryMetrics: Map<string, MisCardMetric>
  dateRange: DateRangeOption
  customFromDate: string
  customToDate: string
  branchFilter: string
  zoneFilter: string
  stateFilter: string
  branchOptions: string[]
  zoneOptions: string[]
  stateOptions: string[]
  onDateRangeChange: (option: DateRangeOption) => void
  onCustomFromDateChange: (date: string) => void
  onCustomToDateChange: (date: string) => void
  onBranchFilterChange: (value: string) => void
  onZoneFilterChange: (value: string) => void
  onStateFilterChange: (value: string) => void
  onSelectCategory: (card: CategoryCardConfig) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  cards,
  selectedCategory,
  categoryMetrics,
  dateRange,
  customFromDate,
  customToDate,
  branchFilter,
  zoneFilter,
  stateFilter,
  branchOptions,
  zoneOptions,
  stateOptions,
  onDateRangeChange,
  onCustomFromDateChange,
  onCustomToDateChange,
  onBranchFilterChange,
  onZoneFilterChange,
  onStateFilterChange,
  onSelectCategory,
  onRefresh,
  isRefreshing = false,
}) => (
  <>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-[16px] font-bold text-[var(--color-navy)]">Report Categories</h3>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">Click a card to filter dashboards &amp; table</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter
          value={dateRange}
          customFromDate={customFromDate}
          customToDate={customToDate}
          onChange={onDateRangeChange}
          onCustomFromDateChange={onCustomFromDateChange}
          onCustomToDateChange={onCustomToDateChange}
        />
        <ReportSelectFilter
          label="Branch"
          value={branchFilter}
          options={branchOptions}
          allLabel="All Branches"
          onChange={onBranchFilterChange}
        />
        <ReportSelectFilter
          label="Zone"
          value={zoneFilter}
          options={zoneOptions}
          allLabel="All Zones"
          onChange={onZoneFilterChange}
        />
        <ReportSelectFilter
          label="State"
          value={stateFilter}
          options={stateOptions}
          allLabel="All States"
          onChange={onStateFilterChange}
        />
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>

    <div className="flex flex-wrap gap-3">
      {cards.map((card) => {
        const isActive = selectedCategory === card.title
        const metric = categoryMetrics.get(card.title)

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectCategory(card)}
            style={{ flex: '1 1 180px' }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
              isActive
                ? 'border-[var(--color-gold)] bg-[#FFFBF2] shadow-md ring-2 ring-[rgba(206,155,1,0.18)]'
                : 'border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] hover:-translate-y-0.5 hover:border-[rgba(206,155,1,0.35)] hover:shadow-md'
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-bold leading-snug text-[var(--color-navy)]">{card.title}</h4>
                <p className="mt-1 text-[22px] font-extrabold leading-none text-[var(--color-navy)]">
                  {metric?.value ?? '—'}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
                  {metric?.subtitle ?? 'Click to load'}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  </>
)
