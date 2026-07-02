// Main page component that assembles the analytics dashboard and its charts.

import React from 'react'
import { AlertTriangle, Clock3, ShieldAlert, Target, TrendingUp } from 'lucide-react'
import { PageHeader, KPICard } from '@/Components/Analytics'
import { PerformanceRadar } from '../charts/PerformanceRadar'
import { StrategyEffectiveness } from '../charts/StrategyEffectiveness'
import { HourlyCallDistribution } from '../charts/HourlyCallDistribution'
import { ProductDistributionChart } from '../charts/ProductDistributionChart'
import { StrategyGapChart } from '../charts/StrategyGapChart'
import { CommunicationEfficiencyChart } from '../charts/CommunicationEfficiencyChart'
import { BranchContributionChart } from '../charts/BranchContributionChart'
import { AgentContributionChart } from '../charts/AgentContributionChart'
import { useAnalytics } from '../hooks/useAnalytics'

export const AnalyticsPage: React.FC = () => {
  const {
    selectedDateFilter,
    setSelectedDateFilter,
    customFromDate,
    setCustomFromDate,
    customToDate,
    setCustomToDate,
    branchFilter,
    setBranchFilter,
    zoneFilter,
    setZoneFilter,
    stateFilter,
    setStateFilter,
    branchOptions,
    zoneOptions,
    stateOptions,
    isRefreshing,
    dashboard,
    handleRefresh,
    error
  } = useAnalytics()

  const radarBest = React.useMemo(() => {
    const items = dashboard?.performanceRadar ?? []
    return items.length ? [...items].sort((a, b) => b.value - a.value)[0] : null
  }, [dashboard?.performanceRadar])

  const radarWeakest = React.useMemo(() => {
    const items = dashboard?.performanceRadar ?? []
    return items.length ? [...items].sort((a, b) => a.value - b.value)[0] : null
  }, [dashboard?.performanceRadar])

  const topStrategy = React.useMemo(() => {
    const items = dashboard?.strategyPerformance ?? []
    return items.length ? [...items].sort((a, b) => b.percentage - a.percentage)[0] : null
  }, [dashboard?.strategyPerformance])

  const peakHour = React.useMemo(() => {
    const items = dashboard?.communicationPerformance ?? []
    return items.length ? [...items].sort((a, b) => b.calls - a.calls)[0] : null
  }, [dashboard?.communicationPerformance])

  const riskBucket = React.useMemo(() => {
    const items = dashboard?.bucketDistribution ?? []
    return items.length ? [...items].sort((a, b) => b.value - a.value)[0] : null
  }, [dashboard?.bucketDistribution])

  const analysisSignals = [
    {
      label: 'Best performing metric',
      value: radarBest ? `${radarBest.metric} ${radarBest.value.toFixed(1)}%` : 'No data',
      note: 'Highest score in the current filtered set',
      icon: TrendingUp,
      tone: 'text-[var(--color-gold)]',
      bg: 'bg-[rgba(206,155,1,0.12)]',
    },
    {
      label: 'Weakest metric',
      value: radarWeakest ? `${radarWeakest.metric} ${radarWeakest.value.toFixed(1)}%` : 'No data',
      note: 'This is the first place to improve',
      icon: AlertTriangle,
      tone: 'text-[#c2410c]',
      bg: 'bg-[rgba(194,65,12,0.12)]',
    },
    {
      label: 'Top strategy',
      value: topStrategy ? `${topStrategy.name} ${topStrategy.percentage.toFixed(1)}%` : 'No data',
      note: 'Best strategy vs. target',
      icon: Target,
      tone: 'text-[var(--color-blue)]',
      bg: 'bg-[var(--color-ice)]',
    },
    {
      label: 'Peak contact hour',
      value: peakHour ? `${peakHour.hour} (${peakHour.calls})` : 'No data',
      note: 'Highest communication volume',
      icon: Clock3,
      tone: 'text-[var(--color-navy)]',
      bg: 'bg-[rgba(5,0,88,0.08)]',
    },
    {
      label: 'Risk bucket watch',
      value: riskBucket ? `${riskBucket.name} ${riskBucket.value.toFixed(0)}%` : 'No data',
      note: 'Largest portfolio concentration',
      icon: ShieldAlert,
      tone: 'text-[var(--color-gold)]',
      bg: 'bg-[rgba(206,155,1,0.12)]',
    },
  ]

  return (
    <div className="animate-[fadeIn_0.35s_ease-out_forwards] space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Advanced analytics and performance insights"
        selectedDateFilter={selectedDateFilter}
        customFromDate={customFromDate}
        customToDate={customToDate}
        onDateFilterChange={setSelectedDateFilter}
        onCustomFromDateChange={setCustomFromDate}
        onCustomToDateChange={setCustomToDate}

        branchFilter={branchFilter}
        zoneFilter={zoneFilter}
        stateFilter={stateFilter}

        branchOptions={branchOptions}
        zoneOptions={zoneOptions}
        stateOptions={stateOptions}

        onBranchFilterChange={setBranchFilter}
        onZoneFilterChange={setZoneFilter}
        onStateFilterChange={setStateFilter}

        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />   

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {(dashboard?.kpiCards ?? []).map((card) => (
          <KPICard key={card.id} card={card} />
        ))}
      </div>

      {error && (
        <div className="surface-card rounded-xl p-4 border border-[rgba(206,155,1,0.18)] bg-[rgba(206,155,1,0.1)] text-sm text-[var(--color-navy)]">
          {String(error instanceof Error ? error.message : 'Unable to load analytics data')}
        </div>
      )}

      <div className="surface-card rounded-xl p-4 border border-[rgba(5,0,88,0.08)]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {analysisSignals.map((signal) => {
            const Icon = signal.icon
            return (
              <div key={signal.label} className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${signal.bg}`}>
                  <Icon className={`h-5 w-5 ${signal.tone}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">{signal.label}</p>
                  <p className="mt-1 text-[15px] font-bold text-[var(--color-navy)] break-words leading-snug">{signal.value}</p>
                  <p className="mt-1 text-[12px] text-[var(--color-ink-muted)] break-words leading-snug">{signal.note}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 1: Performance Radar + Strategy Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceRadar data={dashboard?.performanceRadar ?? []} />
        <StrategyEffectiveness data={dashboard?.strategyPerformance ?? []} />
      </div>

      {/* Section 2: Hourly Call Distribution */}
      <div>
        <HourlyCallDistribution data={dashboard?.communicationPerformance ?? []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyGapChart data={dashboard?.strategyPerformance ?? []} />
        <CommunicationEfficiencyChart data={dashboard?.communicationPerformance ?? []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BranchContributionChart data={dashboard?.branchContributors ?? []} />
        <AgentContributionChart data={dashboard?.agentContributors ?? []} />
      </div>

      {/* Section 3: Channel Performance + Bucket Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductDistributionChart
          data={dashboard?.channelPerformance ?? []}
          title="Recovery Efficiency"
          subtitle="Recovery efficiency by journey type"
        />
        <ProductDistributionChart
          data={dashboard?.bucketDistribution ?? []}
          title="Portfolio Risk Distribution"
          subtitle="DPD risk classification breakdown"
        />
      </div>
    </div>
  )
}

