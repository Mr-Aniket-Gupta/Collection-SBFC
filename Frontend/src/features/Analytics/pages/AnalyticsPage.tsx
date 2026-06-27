// Analytics Page

import React from 'react'
import { PageHeader, KPICard } from '@/Components/Analytics'
import { PerformanceRadar } from '../charts/PerformanceRadar'
import { StrategyEffectiveness } from '../charts/StrategyEffectiveness'
import { HourlyCallDistribution } from '../charts/HourlyCallDistribution'
import { ProductDistributionChart } from '../charts/ProductDistributionChart'
import { BounceReasonAnalysis } from '../charts/BounceReasonAnalysis'
import { useAnalytics } from '../hooks/useAnalytics'
import { kpiCards } from '../data/analytics.data'

export const AnalyticsPage: React.FC = () => {
  const {
    selectedDateFilter,
    setSelectedDateFilter,
    dateFilterOptions,
    isRefreshing,
    handleRefresh,
  } = useAnalytics()

  return (
    <div className="animate-[fadeIn_0.35s_ease-out_forwards] space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Advanced analytics and performance insights"
        selectedDateFilter={selectedDateFilter}
        dateFilterOptions={dateFilterOptions}
        onDateFilterChange={setSelectedDateFilter}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <KPICard key={card.id} card={card} />
        ))}
      </div>

      {/* Section 1: Performance Radar + Strategy Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceRadar />
        <StrategyEffectiveness />
      </div>

      {/* Section 2: Hourly Call Distribution */}
      <div>
        <HourlyCallDistribution />
      </div>

      {/* Section 3: Product Distribution + Bounce Reason Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductDistributionChart />
        <BounceReasonAnalysis />
      </div>
    </div>
  )
}
