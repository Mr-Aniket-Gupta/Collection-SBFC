// ─── Strategy Effectiveness Section ──────────────────────────────────────────

import React from 'react'
import { ChartCard } from '../components/ChartCard'
import { ProgressBar } from '../components/ProgressBar'
import { strategyData } from '../data/analytics.data'

export const StrategyEffectiveness: React.FC = () => {
  return (
    <ChartCard
      title="Strategy Effectiveness"
      subtitle="Current vs. target achievement by collection strategy"
    >
      <div className="flex flex-col gap-6 mt-2">
        {strategyData.map((strategy) => (
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
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[11px] text-slate-400">
                Target: {strategy.target}%
                {strategy.percentage >= strategy.target ? (
                  <span className="ml-2 text-green-600 font-semibold">✓ Achieved</span>
                ) : (
                  <span className="ml-2 text-orange-500 font-semibold">
                    ↑ {strategy.target - strategy.percentage}% to go
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#22C55E]" />
          <span className="text-[12px] text-slate-500 font-medium">Performance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-200" />
          <span className="text-[12px] text-slate-500 font-medium">Target</span>
        </div>
        <span className="text-[12px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
          All Targets Exceeded
        </span>
      </div>
    </ChartCard>
  )
}
