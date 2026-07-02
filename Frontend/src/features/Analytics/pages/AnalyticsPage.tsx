// Main page component that assembles the analytics dashboard and its charts.

import React from 'react'
import { PageHeader, KPICard } from '@/Components/Analytics'
import { ReportSelectFilter } from '@/features/reports/components/ReportSelectFilter'
import { PerformanceRadar } from '../charts/PerformanceRadar'
import { StrategyEffectiveness } from '../charts/StrategyEffectiveness'
import { HourlyCallDistribution } from '../charts/HourlyCallDistribution'
import { ProductDistributionChart } from '../charts/ProductDistributionChart'
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

      {/* Section 1: Performance Radar + Strategy Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceRadar data={dashboard?.performanceRadar ?? []} />
        <StrategyEffectiveness data={dashboard?.strategyPerformance ?? []} />
      </div>

      {/* Section 2: Hourly Call Distribution */}
      <div>
        <HourlyCallDistribution data={dashboard?.communicationPerformance ?? []} />
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

