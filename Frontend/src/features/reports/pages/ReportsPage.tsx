import React, { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  CategorySelector,
  KpiGrid,
  TabSelector,
  Toolbar,
  FilterBar,
  ReportTable,
  RowModal,
} from '@/Components/Reports'
import {
  ChannelConversionChart,
  BucketWiseTrendChart,
  CollectionTrendChart,
  RecoveryDistributionChart
} from '@/features/reports/charts'
import { useReports } from '@/features/reports/hooks/useReports'
import { useReportMetrics } from '@/features/reports/hooks/useReportMetrics'
import { exportReportsToExcel } from '@/features/reports/utils/excelExport'
import { ReportItem } from '@/features/reports/types'

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch reports list (filtered/sorted/paginated)
  const {
    filters,
    reports,
    total,
    isLoading: isReportsLoading,
    setCategory,
    setStatus,
    setSearch,
    setPage,
    setLimit,
    setSorting,
    resetFilters,
    refetch: refetchReports
  } = useReports()

  // Fetch metrics based on active category selection
  const {
    metrics,
    channelConversion,
    bucketTrend,
    collectionTrend,
    recoveryDistribution,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics
  } = useReportMetrics(filters.category)

  // Handle page-level data refresh
  const handlePageRefresh = () => {
    refetchReports()
    refetchMetrics()
    toast.success('Report library and metrics refreshed!')
  }

  // Handle category card clicks
  const handleSelectCategory = (category: string) => {
    setCategory(category)
  }

  // Handle viewing detailed row modal
  const handleViewReport = (report: ReportItem) => {
    setSelectedReport(report)
    setIsModalOpen(true)
  }

  // Handle full CSV list export
  const handleExportCSV = () => {
    exportReportsToExcel(reports, `Reports_Export_${filters.category}_${filters.status}.xlsx`)
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--color-navy)]">
      <section className="surface-card rounded-xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-gold)]">MIS Workspace</p>
          <h1 className="text-[24px] font-bold text-[var(--color-navy)] mt-1">Reports Control Center</h1>
          <p className="text-[13px] text-[var(--color-ink-muted)] mt-1">
            Monitor report readiness, collection performance, and funnel health from one view.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-full xl:min-w-[420px]">
          {[
            { label: 'Reports', value: total },
            { label: 'Category', value: filters.category },
            { label: 'Status', value: filters.status },
          ].map((item) => (
            <div key={item.label} className="surface-ice rounded-lg border border-[rgba(5,0,88,0.08)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-muted)]">{item.label}</p>
              <p className="text-sm font-bold text-[var(--color-navy)] truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category selector panel */}
      <section className="surface-card rounded-xl p-5">
        <CategorySelector
          selectedCategory={filters.category}
          onSelectCategory={handleSelectCategory}
        />
      </section>

      {/* Subheader tabs, refresh actions, and toolbar bar */}
      <section className="surface-card rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <TabSelector activeTab={activeTab} onChangeTab={setActiveTab} />
          
          {/* Refresh Action Trigger */}
          <button
            onClick={handlePageRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[var(--color-ice)] border border-[rgba(5,0,88,0.12)] rounded-lg text-[var(--color-navy)] hover:text-[var(--color-gold)] cursor-pointer transition-all duration-200 active:scale-95 shadow-sm text-xs font-bold"
            title="Refresh Report Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReportsLoading || isMetricsLoading ? 'animate-spin text-[var(--color-gold)]' : 'text-[var(--color-ink-muted)]'}`} />
            <span>Refresh</span>
          </button>
        </div>
        <Toolbar />
      </section>

      {/* Conditional layout views */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* KPI numbers card grid */}
          <KpiGrid metrics={metrics} />

          {/* Grid of chart dashboards */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChannelConversionChart data={channelConversion} />
            <BucketWiseTrendChart data={bucketTrend} />
            <CollectionTrendChart data={collectionTrend} />
            <RecoveryDistributionChart data={recoveryDistribution} />
          </section>

          {/* Primary tabular details library */}
          <section className="space-y-0">
            <FilterBar
              search={filters.search}
              onSearchChange={setSearch}
              category={filters.category}
              onCategoryChange={setCategory}
              status={filters.status}
              onStatusChange={setStatus}
              totalCount={total}
              onExport={handleExportCSV}
              onReset={resetFilters}
            />
            <ReportTable
              reports={reports}
              total={total}
              filters={filters}
              isLoading={isReportsLoading}
              onPageChange={setPage}
              onLimitChange={setLimit}
              onSortChange={setSorting}
              onViewReport={handleViewReport}
            />
          </section>
        </div>
      )}

      {activeTab === 'Detailed Reports' && (
        <section className="space-y-0">
          <FilterBar
            search={filters.search}
            onSearchChange={setSearch}
            category={filters.category}
            onCategoryChange={setCategory}
            status={filters.status}
            onStatusChange={setStatus}
            totalCount={total}
            onExport={handleExportCSV}
            onReset={resetFilters}
          />
          <ReportTable
            reports={reports}
            total={total}
            filters={filters}
            isLoading={isReportsLoading}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onSortChange={setSorting}
            onViewReport={handleViewReport}
          />
        </section>
      )}

      {activeTab === 'Trends' && (
        <div className="space-y-6">
          <KpiGrid metrics={metrics} />
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BucketWiseTrendChart data={bucketTrend} />
            <CollectionTrendChart data={collectionTrend} />
          </section>
        </div>
      )}

      {activeTab === 'Funnel Analysis' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChannelConversionChart data={channelConversion} />
          <RecoveryDistributionChart data={recoveryDistribution} />
        </section>
      )}

      {/* Detail overlay overlay modal */}
      <RowModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default ReportsPage
