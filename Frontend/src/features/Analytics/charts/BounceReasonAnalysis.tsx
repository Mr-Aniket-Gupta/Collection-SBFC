// ─── Bounce Reason Analysis ───────────────────────────────────────────────────

import React from 'react'
import { ChartCard } from '../components/ChartCard'
import { ProgressBar } from '../components/ProgressBar'
import { bounceReasons } from '../data/analytics.data'

export const BounceReasonAnalysis: React.FC = () => {
  const maxCount = Math.max(...bounceReasons.map((r) => r.count))

  return (
    <ChartCard
      title="Bounce Reason Analysis"
      subtitle="Top reasons for payment bounce failures"
    >
      <div className="flex flex-col gap-5 mt-1">
        {bounceReasons.map((item, index) => (
          <div key={item.reason} className="flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Rank badge */}
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <span className="text-[13px] font-semibold text-slate-700">{item.reason}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] font-bold text-[#00044A]">
                  {item.count.toLocaleString()}
                </span>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${item.color}18`,
                    color: item.color,
                  }}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Animated progress bar */}
            <ProgressBar
              percentage={Math.round((item.count / maxCount) * 100)}
              color={item.color}
              showPercentageBadge={false}
              animated
              height="h-2"
            />
          </div>
        ))}
      </div>

      {/* Total row */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-slate-500">Total Bounces</span>
        <span className="text-[16px] font-bold text-[#00044A]">
          {bounceReasons.reduce((sum, r) => sum + r.count, 0).toLocaleString()}
        </span>
      </div>
    </ChartCard>
  )
}
