import React from 'react'
import { KpiCard } from './KpiCard'
import { CreditCard, Smartphone, Target, CheckCircle2 } from 'lucide-react'
import { MetricSummary } from '@/features/reports/types'
import { formatCurrencyINR, formatPercent, formatNumber } from '@/features/reports/utils/formatters'

interface KpiGridProps {
  metrics?: MetricSummary
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[var(--color-ice)] rounded-xl border border-[rgba(5,0,88,0.08)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="TOTAL COLLECTION"
        value={formatCurrencyINR(metrics.totalCollection)}
        trend={metrics.totalCollectionTrend}
        icon={CreditCard}
        iconBgColor="bg-[var(--color-ice)]"
        iconColor="text-[var(--color-navy)]"
      />
      <KpiCard
        title="DIGITAL COLLECTION"
        value={formatCurrencyINR(metrics.digitalCollection)}
        trend={metrics.digitalCollectionTrend}
        icon={Smartphone}
        iconBgColor="bg-[var(--color-ice)]"
        iconColor="text-[var(--color-blue)]"
      />
      <KpiCard
        title="RESOLUTION RATE"
        value={formatPercent(metrics.resolutionRate)}
        trend={metrics.resolutionRateTrend}
        icon={Target}
        iconBgColor="bg-[rgba(206,155,1,0.13)]"
        iconColor="text-[var(--color-gold)]"
      />
      <KpiCard
        title="CASES RESOLVED"
        value={formatNumber(metrics.casesResolved)}
        trend={metrics.casesResolvedTrend}
        icon={CheckCircle2}
        iconBgColor="bg-[var(--color-ice)]"
        iconColor="text-[var(--color-blue)]"
      />
    </div>
  )
}

export default KpiGrid
