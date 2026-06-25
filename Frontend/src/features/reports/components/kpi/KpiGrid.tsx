import React from 'react'
import { KpiCard } from './KpiCard'
import { CreditCard, Smartphone, Target, CheckCircle2 } from 'lucide-react'
import { MetricSummary } from '../../types'
import { formatCurrencyINR, formatPercent, formatNumber } from '../../utils/formatters'

interface KpiGridProps {
  metrics?: MetricSummary
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800" />
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
        iconBgColor="bg-slate-50 dark:bg-slate-900"
        iconColor="text-indigo-600 dark:text-indigo-400"
      />
      <KpiCard
        title="DIGITAL COLLECTION"
        value={formatCurrencyINR(metrics.digitalCollection)}
        trend={metrics.digitalCollectionTrend}
        icon={Smartphone}
        iconBgColor="bg-slate-50 dark:bg-slate-900"
        iconColor="text-sky-600 dark:text-sky-400"
      />
      <KpiCard
        title="RESOLUTION RATE"
        value={formatPercent(metrics.resolutionRate)}
        trend={metrics.resolutionRateTrend}
        icon={Target}
        iconBgColor="bg-slate-50 dark:bg-slate-900"
        iconColor="text-violet-600 dark:text-violet-400"
      />
      <KpiCard
        title="CASES RESOLVED"
        value={formatNumber(metrics.casesResolved)}
        trend={metrics.casesResolvedTrend}
        icon={CheckCircle2}
        iconBgColor="bg-slate-50 dark:bg-slate-900"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
    </div>
  )
}
export default KpiGrid
