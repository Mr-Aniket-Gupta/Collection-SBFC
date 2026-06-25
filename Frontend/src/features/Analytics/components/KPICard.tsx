// ─── KPICard Component ────────────────────────────────────────────────────────

import React from 'react'
import { Target, Zap, Clock, TrendingUp } from 'lucide-react'
import type { KPICard as KPICardType } from '../types/analytics.types'

interface KPICardProps {
  card: KPICardType
}

const iconMap: Record<KPICardType['iconType'], React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  target: Target,
  zap: Zap,
  clock: Clock,
  trending: TrendingUp,
}

export const KPICard: React.FC<KPICardProps> = ({ card }) => {
  const Icon = iconMap[card.iconType]

  return (
    <div
      className="
        bg-white rounded-[14px] p-6 shadow-sm border border-gray-100
        hover:shadow-md hover:-translate-y-[2px]
        transition-all duration-200 ease-out
        flex flex-col gap-4
      "
    >
      {/* Icon */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.bgColor}`}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: card.iconColor }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-medium text-slate-500">{card.title}</p>
        <p className="text-[30px] font-bold text-[#00044A] leading-tight">{card.value}</p>
        <div className="flex items-center gap-2 mt-1">
          {card.trend && (
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                ${card.trendDirection === 'up' ? 'bg-green-100 text-green-700' : ''}
                ${card.trendDirection === 'down' ? 'bg-red-100 text-red-700' : ''}
                ${card.trendDirection === 'neutral' ? 'bg-slate-100 text-slate-600' : ''}
              `}
            >
              {card.trend}
            </span>
          )}
          <span className="text-[12px] text-slate-400">{card.subtitle}</span>
        </div>
      </div>
    </div>
  )
}
