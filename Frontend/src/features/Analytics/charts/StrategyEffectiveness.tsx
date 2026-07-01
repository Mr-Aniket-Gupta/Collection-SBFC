// Renders progress bars to show the effectiveness of various strategies.

import React, { useState } from 'react'
import { ChartCard, ProgressBar } from '@/Components'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { StrategyRow } from '../types/analytics.types'

interface StrategyEffectivenessProps {
  data: StrategyRow[]
}

export const StrategyEffectiveness: React.FC<StrategyEffectivenessProps> = ({ data = [] }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(data.length / itemsPerPage)

  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages))
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1))

  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <ChartCard
      title="Strategy Effectiveness"
      subtitle="Current vs. target achievement by collection strategy"
      data={data}
    >
      <div className="flex flex-col gap-6 mt-2 min-h-[320px]">
        {paginatedData.map((strategy) => (
          <div key={strategy.name} className="flex flex-col gap-1.5">
            <ProgressBar
              label={strategy.name}
              percentage={strategy.percentage}
              target={strategy.target}
              color={strategy.color}
              showPercentageBadge
              showTargetLabel
              animated
              height="h-2.5"
            />
            {/* Below-bar target indicator */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--color-ice)]" />
              <span className="text-[11px] text-[var(--color-ink-muted)]">
                Target: {strategy.target}%
                {strategy.percentage >= strategy.target ? (
                  <span className="ml-2 text-[var(--color-gold)] font-semibold">Achieved</span>
                ) : (
                  <span className="ml-2 text-[var(--color-blue)] font-semibold">
                    {(strategy.target - strategy.percentage).toFixed(1)}% to go
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[var(--color-ink-muted)]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1 rounded-md hover:bg-[rgba(5,0,88,0.05)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--color-navy)]" />
            </button>
            <span className="text-xs font-medium text-[var(--color-navy)]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md hover:bg-[rgba(5,0,88,0.05)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[var(--color-navy)]" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-6 pt-5 border-t border-[rgba(5,0,88,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-gold)]" />
          <span className="text-[12px] text-[var(--color-ink-muted)] font-medium">Performance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-ice)]" />
          <span className="text-[12px] text-[var(--color-ink-muted)] font-medium">Target</span>
        </div>
        <span className="text-[12px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2.5 py-1 rounded-lg">
          {data.every((strategy) => strategy.percentage >= strategy.target) ? 'All Targets Exceeded' : 'Targets In Progress'}
        </span>
      </div>
    </ChartCard>
  )
}
