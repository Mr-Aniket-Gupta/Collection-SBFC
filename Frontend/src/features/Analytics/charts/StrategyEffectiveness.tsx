// Strategy Effectiveness Section

import React from 'react'
import { ChartCard, ProgressBar } from '@/Components'
import type { StrategyRow } from '../types/analytics.types'

interface StrategyEffectivenessProps {
  data: StrategyRow[]
}

export const StrategyEffectiveness: React.FC<StrategyEffectivenessProps> = ({ data }) => {
  return (
    <ChartCard
      title="Strategy Effectiveness"
      subtitle="Current vs. target achievement by collection strategy"
      data={data}
    >
      <div className="flex flex-col gap-6 mt-2">
        {data.map((strategy) => (
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
                    {strategy.target - strategy.percentage}% to go
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

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
