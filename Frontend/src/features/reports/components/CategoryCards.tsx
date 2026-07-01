import React from 'react'
import { RotateCw } from 'lucide-react'
import type { ReportTableKey } from '../hooks/useReports'
import type { MisCardMetric } from '../utils/misCardMetrics'
import { DateRangeFilter } from './DateRangeFilter'
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
  onDateRangeChange: (option: DateRangeOption) => void
  onSelectCategory: (card: CategoryCardConfig) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  cards,
  selectedCategory,
  categoryMetrics,
  dateRange,
  onDateRangeChange,
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
        <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
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

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card) => {
        const isActive = selectedCategory === card.title
        const metric = categoryMetrics.get(card.title)

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectCategory(card)}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
              isActive
                ? 'border-[var(--color-gold)] bg-[#FFFBF2] shadow-md ring-2 ring-[rgba(206,155,1,0.18)]'
                : 'border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] hover:-translate-y-0.5 hover:border-[rgba(206,155,1,0.35)] hover:shadow-md'
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
              {card.icon}
            </div>
            <h4 className="text-[13px] font-bold leading-snug text-[var(--color-navy)]">{card.title}</h4>
            <p className="mt-2 text-[22px] font-extrabold leading-none text-[var(--color-navy)]">
              {metric?.value ?? '—'}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
              {metric?.subtitle ?? 'Click to load'}
            </p>
          </button>
        )
      })}
    </div>
  </>
)
