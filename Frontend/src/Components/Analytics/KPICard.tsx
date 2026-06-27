// KPICard Component

import React from 'react'
import { Target, Zap, Clock, TrendingUp, Wallet, Receipt, MessageCircle, CheckCircle2 } from 'lucide-react'
import type { KPICard as KPICardType } from '@/features/Analytics/types/analytics.types'

interface KPICardProps {
  card: KPICardType
}

const iconMap: Record<KPICardType['iconType'], React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  target: Target,
  zap: Zap,
  clock: Clock,
  trending: TrendingUp,
  wallet: Wallet,
  receipt: Receipt,
  'message-circle': MessageCircle,
  'check-circle': CheckCircle2,
}

export const KPICard: React.FC<KPICardProps> = ({ card }) => {
  const Icon = iconMap[card.iconType] ?? Target

  return (
    <div
      className="
        surface-card rounded-xl p-5 border-l-4 border-l-[var(--color-gold)]
        hover:-translate-y-[2px]
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
        <p className="text-[12px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wide">{card.title}</p>
        <p className="text-[28px] font-bold text-[var(--color-navy)] leading-tight">{card.value}</p>
        <div className="flex items-center gap-2 mt-1">
          {card.trend && (
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                ${card.trendDirection === 'up' ? 'bg-[rgba(206,155,1,0.14)] text-[var(--color-gold)]' : ''}
                ${card.trendDirection === 'down' ? 'bg-[var(--color-ice)] text-[var(--color-blue)]' : ''}
                ${card.trendDirection === 'neutral' ? 'bg-[var(--color-ice)] text-[var(--color-ink-muted)]' : ''}
              `}
            >
              {card.trend}
            </span>
          )}
          <span className="text-[12px] text-[var(--color-ink-muted)]">{card.subtitle}</span>
        </div>
      </div>
    </div>
  )
}

export default KPICard
