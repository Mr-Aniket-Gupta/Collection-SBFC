import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  RotateCw, Search, Printer, Share2, Download, TrendingDown, TrendingUp,
  Wallet, Smartphone, Target, CheckCircle, ArrowUpDown,
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { useReports } from '@/features/reports/hooks/useReports'
import type { ReportTableKey } from '@/features/reports/hooks/useReports'
import type { SortOrder } from '@/features/reports/types'
import { CategoryCards, type CategoryCardConfig } from '@/features/reports/components/CategoryCards'
import { ShareOptionsModal, type ShareOption } from '@/features/reports/components/ShareOptionsModal'
import { useReportFilters } from '@/Components/Filters/useReportFilters'
import {
  ActiveCasesByBranchChart,
  CommunicationFunnelChart,
  ChannelConversionChart,
  BucketWiseTrendChart,
  CollectionTrendChart,
  PaymentVolumeTrendChart,
  RecoveryDistributionChart,
} from '@/features/reports/charts'


import {
  buildBranchCaseTrend,
  buildBucketWiseTrendData,
  buildChannelConversionData,
  buildCollectionTrendData,
  buildCommunicationFunnel,
  buildPaymentVolumeTrend,
  buildRecoveryDistributionData,
} from '@/features/reports/utils/chartBuilders'
import { formatDateRangeLabel, getDefaultCustomToDate } from '@/Components/dateFilter'
import { printElement, shareElementAsImage } from '@/features/reports/utils/captureUtils'
import { downloadMultiSheetWorkbook, shareCsvFile, toExportRows } from '@/features/reports/utils/excelExport'
import { buildMisCardMetrics, groupTableRowsFromBundle } from '@/features/reports/utils/misCardMetrics'
import {
  applyCategoryGlobalFilter,
  EMPTY_BUNDLE,
  filterBundleByBranchZone,
  filterBundleByDateRange,
} from '@/features/reports/utils/reportFilterEngine'
import { buildReportsFromBundle, fetchReportTableBundle } from '@/features/reports/utils/reportDataUtils'
import { makeReportRow, matchesSearch } from '@/features/reports/utils/reportHelpers'
import {
  flattenRows,
  isPlainObject,
  looksLikeJsonString,
  prettyTitle,
  safeToString,
  shouldFormatDateColumn,
  stringifyCompact,
  tryFormatDate,
} from '@/features/reports/utils/tableUtils'

const REPORT_LIBRARY_FETCH_LIMIT = 200
// const readStoredCustomToDate = (): string => {
//   const stored = sessionStorage.getItem(CUSTOM_TO_STORAGE_KEY)
//   if (stored && !Number.isNaN(new Date(stored).getTime())) return stored
//   return getDefaultCustomToDate()
// }

const CATEGORY_CARDS: CategoryCardConfig[] = [
  { id: 'recovery', title: 'Recovery MIS', tableKey: 'payments', icon: <Wallet className="h-5 w-5 text-[var(--color-navy)]" />, accent: 'bg-[var(--color-navy)]', iconBg: 'bg-[var(--color-ice)]' },
  { id: 'payment', title: 'Payment MIS', tableKey: 'payments', icon: <Wallet className="h-5 w-5 text-[#0F766E]" />, accent: 'bg-[#0F766E]', iconBg: 'bg-[#ECFEF5]' },
  { id: 'bucket', title: 'Bucket-wise MIS', tableKey: 'dpd-cases', icon: <Target className="h-5 w-5 text-[var(--color-gold)]" />, accent: 'bg-[var(--color-gold)]', iconBg: 'bg-[rgba(206,155,1,0.12)]' },
  { id: 'digital', title: 'Digital Recovery', tableKey: 'payments', icon: <Smartphone className="h-5 w-5 text-[#8D6B19]" />, accent: 'bg-[#8D6B19]', iconBg: 'bg-[#FDF9F0]' },
  { id: 'strategy', title: 'Strategy Reports', tableKey: 'strategies', icon: <Share2 className="h-5 w-5 text-[#5B2C6F]" />, accent: 'bg-[#5B2C6F]', iconBg: 'bg-[#F4ECF7]' },
  { id: 'comm', title: 'Communication Reports', tableKey: 'communication_logs', icon: <Search className="h-5 w-5 text-[#D35400]" />, accent: 'bg-[#D35400]', iconBg: 'bg-[#FDEDEC]' },
  { id: 'dpdCases', title: 'DPD Cases', tableKey: 'dpd-cases', icon: <TrendingUp className="h-5 w-5 text-[#117A65]" />, accent: 'bg-[#117A65]', iconBg: 'bg-[#E8F8F5]' },
  { id: 'bounceAnalysis', title: 'Bounce Analysis', tableKey: 'bounce-cases', icon: <ArrowUpDown className="h-5 w-5 text-[#B03A2E]" />, accent: 'bg-[#B03A2E]', iconBg: 'bg-[#FDECEA]' },
]

const TABS = ['Overview', 'Detailed Reports'] as const

export const ReportsPage: React.FC = () => {
  const params = useParams()
  const navigate = useNavigate()
  const overviewAnalyticsRef = useRef<HTMLDivElement>(null)
  const detailedReportsRef = useRef<HTMLDivElement>(null)

  const {
    reportTables, activeTable, setActiveTable, rows: rawRows, total,
    tableColumns: rawTableColumns, isLoading, page, setPage, limit, setLimit, refetch, error,
  } = useReports(params.tableKey)

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareProcessing, setShareProcessing] = useState(false)

  const { data: rawTableBundle, isFetching: isLibraryLoading, refetch: refetchLibrary } = useQuery({
    queryKey: ['reportTableBundle', REPORT_LIBRARY_FETCH_LIMIT],
    queryFn: () => fetchReportTableBundle(REPORT_LIBRARY_FETCH_LIMIT, ['branches', 'dpd-cases', 'strategies', 'strategy-execution-log', 'bounce-cases', 'payments', 'communication_logs', 'ptps', 'agents']),
  })

  const tableBundle = rawTableBundle ?? EMPTY_BUNDLE()
  const filters = useReportFilters(tableBundle, { storageKeyPrefix: 'reports' })

  const dateFilteredBundle = useMemo(
    () => filterBundleByDateRange(tableBundle, filters.dateRange, filters.customFromDate, filters.customToDate),
    [tableBundle, filters.dateRange, filters.customFromDate, filters.customToDate],
  )

  const locationFilteredBundle = useMemo(
    () => filterBundleByBranchZone(dateFilteredBundle, filters.branchFilter, filters.zoneFilter, filters.stateFilter),
    [dateFilteredBundle, filters.branchFilter, filters.zoneFilter, filters.stateFilter],
  )

  const { bundle: categoryFilteredBundle } = useMemo(
    () => applyCategoryGlobalFilter(locationFilteredBundle, selectedCategory),
    [locationFilteredBundle, selectedCategory],
  )

  const syncBundle = selectedCategory ? categoryFilteredBundle : locationFilteredBundle

  const syncReports = useMemo(
    () => buildReportsFromBundle(syncBundle),
    [syncBundle],
  )

  const rows = useMemo(() => {
    const bundleRows = syncBundle[activeTable]
    if (rawTableBundle) return bundleRows
    return flattenRows(rawRows)
  }, [syncBundle, activeTable, rawTableBundle, rawRows])

  const tableColumns = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    rows.forEach((row) => {
      if (!isPlainObject(row)) return
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) { seen.add(key); ordered.push(key) }
      })
    })
    return ordered.length > 0 ? ordered : rawTableColumns
  }, [rows, rawTableColumns])

  const effectiveTableColumns = useMemo(() => tableColumns, [tableColumns])

  const currentTableReports = useMemo(
    () => rows.map((row, i) => makeReportRow(row, prettyTitle(activeTable), i)),
    [rows, activeTable],
  )

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return syncReports.filter((report) => {
      if (statusFilter && report.status !== statusFilter) return false
      return matchesSearch(report, term)
    })
  }, [syncReports, search, statusFilter])

  const filteredCurrentTableRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return currentTableReports.filter((report) => {
      if (statusFilter && report.status !== statusFilter) return false
      return matchesSearch(report, term)
    })
  }, [currentTableReports, search, statusFilter])

  const sortedTableRows = useMemo(() => {
    const sortKey = effectiveTableColumns.find((c) => shouldFormatDateColumn(c) || c === 'status') ?? effectiveTableColumns[0]
    if (!sortKey) return filteredCurrentTableRows
    return [...filteredCurrentTableRows].sort((a, b) => {
      const cmp = safeToString(a.source[sortKey]).localeCompare(safeToString(b.source[sortKey]), undefined, { numeric: true })
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [filteredCurrentTableRows, effectiveTableColumns, sortOrder])

  const filteredSourceRows = useMemo(() => {
    const start = (page - 1) * limit
    return sortedTableRows.slice(start, start + limit).map((r) => r.source)
  }, [sortedTableRows, page, limit])

  const detailedTotal = sortedTableRows.length
  const totalPages = Math.max(1, Math.ceil((rawTableBundle ? detailedTotal : total) / limit))

  const categoryMetrics = useMemo(
    () => buildMisCardMetrics(
      {
        recovery: 'Recovery MIS',
        payment: 'Payment MIS',
        bucket: 'Bucket-wise MIS',
        digital: 'Digital Recovery',
        strategy: 'Strategy Reports',
        comm: 'Communication Reports',
        bounce: 'Bounce Analysis',
      },
      groupTableRowsFromBundle(locationFilteredBundle),
    ),
    [locationFilteredBundle],
  )

  const chartReports = syncReports

  const channelConversionData = useMemo(() => buildChannelConversionData(chartReports), [chartReports])
  const bucketWiseTrendData = useMemo(() => buildBucketWiseTrendData(chartReports), [chartReports])
  const collectionTrendData = useMemo(() => buildCollectionTrendData(chartReports), [chartReports])
  const recoveryDistributionData = useMemo(() => buildRecoveryDistributionData(chartReports), [chartReports])
  const paymentVolumeTrend = useMemo(() => buildPaymentVolumeTrend(chartReports), [chartReports])
  const branchCaseTrend = useMemo(() => buildBranchCaseTrend(chartReports), [chartReports])
  const communicationFunnel = useMemo(() => buildCommunicationFunnel(chartReports), [chartReports])

  const resetAllFilters = () => {
    filters.resetFilters()
    setSearch('')
    setSelectedCategory('')
    setStatusFilter('')
    setSortOrder('asc')
    setPage(1)
  }

  const selectReportTable = (table: ReportTableKey) => {
    setSelectedCategory('')
    navigate(`/reports/${table}`)
    setActiveTable(table)
    setPage(1)
  }

  const selectCategory = (cat: CategoryCardConfig) => {
    const same = selectedCategory === cat.title
    setSelectedCategory(same ? '' : cat.title)
    setStatusFilter('')
    setPage(1)
    // Do NOT navigate to the detailed reports view when clicking a category card.
    // Keep the user on the current tab (usually Overview) and apply the filter in-place.
  }

  const refreshPageContent = async () => {
    resetAllFilters()

    await Promise.all([refetchLibrary(), refetch()])
    toast.success('Reports refreshed')
  }

  const dateRangeLabel = formatDateRangeLabel(filters.dateRange, filters.customFromDate, filters.customToDate)

  const getPrintTarget = (): { element: HTMLElement; title: string } | null => {
    if (activeTab === 'Overview' && overviewAnalyticsRef.current) {
      return { element: overviewAnalyticsRef.current, title: `Reports Overview — ${dateRangeLabel}` }
    }
    if (activeTab === 'Detailed Reports' && detailedReportsRef.current) {
      return { element: detailedReportsRef.current, title: `Raw DCSP Tables — ${prettyTitle(activeTable)}` }
    }
    return null
  }

  const buildShareText = () => {
    if (activeTab === 'Detailed Reports') {
      return [
        `Report: ${prettyTitle(activeTable)}`,
        `Date Range: ${dateRangeLabel}`,
        `Branch: ${filters.branchFilter || 'All'}`,
        `Zone: ${filters.zoneFilter || 'All'}`,
        `State: ${filters.stateFilter || 'All'}`,
        `Category: ${selectedCategory || 'All'}`,
        `Page: ${page} of ${totalPages}`,
      ].join('\n')
    }

    return [
      'Report: Overview',
      `Date Range: ${dateRangeLabel}`,
      `Branch: ${filters.branchFilter || 'All'}`,
      `Zone: ${filters.zoneFilter || 'All'}`,
      `State: ${filters.stateFilter || 'All'}`,
      `Category: ${selectedCategory || 'All'}`,
      `Filtered Records: ${filteredRows.length}`,
    ].join('\n')
  }

  const resetDetailedFilters = async () => {
    resetAllFilters()
    await refetch()
    toast.success('Filters reset & table refreshed')
  }

  const buildDetailedExcelSheets = () => [{
    name: prettyTitle(activeTable).slice(0, 31),
    rows: [
      { section: `Raw DCSP Tables — ${prettyTitle(activeTable)}` },
      ...toExportRows(filteredSourceRows),
    ],
  }]

  const buildExportSheets = () => {
    type ExportSheet = {
      name: string
      rows: Record<string, string>[]
    }
    const sheets: ExportSheet[] = [
      {
        name: 'Summary',
        rows: [
          { metric: 'Date Range', value: dateRangeLabel },
          { metric: 'Branch', value: filters.branchFilter || 'All' },
          { metric: 'Zone', value: filters.zoneFilter || 'All' },
          { metric: 'State', value: filters.stateFilter || 'All' },
          { metric: 'Category', value: selectedCategory || 'All' },
          { metric: 'Filtered Records', value: String(filteredRows.length) },
        ],
      },
    ].filter((sheet) => sheet.rows.length > 0)

    // agents removed — table no longer exists in the new schema.
    const tableKeys: ReportTableKey[] = [
      'strategies',
      'strategy-execution-log',
      'dpd-cases',
      'bounce-cases',
      'payments',
      'communication_logs',
      'ptps',
      'branches',
      'agents',
    ]

    tableKeys.forEach((key) => {
      const rows = syncBundle[key] || []
      if (rows.length > 0) {
        sheets.push({
          name: prettyTitle(key).slice(0, 31),
          rows: toExportRows(rows),
        })
      }
    })

    return sheets
  }

  const handlePrint = async () => {
    if (activeTab === 'Detailed Reports') {
      try {
        await downloadMultiSheetWorkbook(
          buildDetailedExcelSheets(),
          `Raw-DCSP-${prettyTitle(activeTable)}.xlsx`,
        )
        toast.success('Excel file downloaded')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Unable to export detailed report')
      }
      return
    }

    const target = getPrintTarget()
    if (!target) {
      toast.error('Nothing to print on this tab')
      return
    }
    printElement(target.element, target.title)
    toast.success('Print dialog opened')
  }

  const handleShareSelect = async (option: ShareOption) => {
    setShareProcessing(true)
    try {
      if (activeTab === 'Detailed Reports') {
        const filename = `Raw-DCSP-${prettyTitle(activeTable)}.xlsx`
        await shareCsvFile(buildDetailedExcelSheets(), filename, buildShareText(), option)
        toast.success('CSV share action completed')
        setShareOpen(false)
        return
      }

      const target = getPrintTarget()
      if (!target) {
        toast.error('Nothing to share on this tab')
        return
      }

      const filename = `Reports-${activeTab.replace(/\s+/g, '-')}-${dateRangeLabel.replace(/\s+/g, '-')}.png`
      await shareElementAsImage(target.element, filename, buildShareText(), option)
      toast.success('Image share action completed')
      setShareOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Share failed')
    } finally {
      setShareProcessing(false)
    }
  }

  const handleExport = async () => {
    try {
      if (activeTab === 'Detailed Reports') {
        await downloadMultiSheetWorkbook(buildDetailedExcelSheets(), `Raw-DCSP-${prettyTitle(activeTable)}.xlsx`)
      } else {
        await downloadMultiSheetWorkbook(buildExportSheets(), `Reports-${dateRangeLabel.replace(/\s+/g, '-')}.xlsx`)
      }
      toast.success('Excel file downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to export reports')
    }
  }

  const renderKpis = () => (
    <div className="reports-kpi-grid">
      {[
        { label: 'TOTAL RECORDS', value: ((syncBundle['dpd-cases']?.length || 0) + (syncBundle['bounce-cases']?.length || 0)).toLocaleString('en-IN'), diff: 'Total Cases in Bundle', dir: 'up' as const, icon: <Wallet className="h-5 w-5 text-[var(--color-navy)]" /> },
        { label: 'TOTAL BRANCH', value: filters.branchOptions.length.toLocaleString('en-IN'), diff: 'Available Branches', dir: 'up' as const, icon: <Smartphone className="h-5 w-5 text-[var(--color-navy)]" /> },
        { label: 'TOTAL ZONE', value: filters.zoneOptions.length.toLocaleString('en-IN'), diff: 'Available Zones', dir: 'up' as const, icon: <Target className="h-5 w-5 text-[var(--color-navy)]" /> },
        {
          label: 'ACTIVE CASES', value: (
            (syncBundle['dpd-cases'] || []).filter((c: any) => safeToString(c.loan_status).toLowerCase() === 'active').length +
            (syncBundle['bounce-cases'] || []).filter((c: any) => safeToString(c.status).toLowerCase() === 'pending_strategy' || safeToString(c.status).toLowerCase() === 'pending').length
          ).toLocaleString('en-IN'), diff: 'Cases with active status', dir: 'up' as const, icon: <CheckCircle className="h-5 w-5 text-[var(--color-navy)]" />
        },
      ].map((kpi) => (
        <div key={kpi.label} className="reports-kpi-card flex flex-col relative">
          <div className="mb-2 flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">{kpi.label}</span>
            <div className="rounded-lg bg-[var(--color-ice)] p-1.5">{kpi.icon}</div>
          </div>
          <span className="mb-3 text-2xl font-extrabold text-[var(--color-navy)]">{kpi.value}</span>
          <div className="inline-flex w-fit items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
            {kpi.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {kpi.diff}
          </div>
        </div>
      ))}
    </div>
  )


  const renderTabsAndActions = () => (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div className="relative inline-flex rounded-2xl border border-[rgba(5,0,88,0.08)] bg-[#F8FAFC] p-1 shadow-sm">

        {/* Sliding Background */}
        <div className={` absolute top-1 bottom-1 rounded-xl shadow-sm transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
      ${activeTab === 'Overview' ? 'left-1 w-[150px] bg-white' : 'left-[151px] w-[170px] bg-white'}`}
        />

        <button
          type="button"
          onClick={() => setActiveTab('Overview')}
          className={`
      relative z-10 w-[150px]
      px-5 py-3 text-sm font-semibold
      transition-colors duration-500
      ${activeTab === 'Overview'
              ? 'text-[var(--color-navy)]'
              : 'text-gray-500'
            }
    `}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Detailed Reports')}
          className={`
      relative z-10 w-[170px]
      px-5 py-3 text-sm font-semibold
      transition-colors duration-500
      ${activeTab === 'Detailed Reports'
              ? 'text-[var(--color-navy)]'
              : 'text-gray-500'
            }
    `}
        >
          Detailed Reports
        </button>

      </div>




      <div className="no-print flex items-center gap-3">
        {activeTab !== 'Detailed Reports' && (
          <>
            <button type="button" onClick={handlePrint} className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button type="button" onClick={() => setShareOpen(true)} className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </>
        )}
        <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:brightness-105">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
    </div>
  )


  const renderTrends = () => (
    <>
      <div className="w-full">
        <PaymentVolumeTrendChart data={paymentVolumeTrend} />
      </div>
      <div className="reports-chart-grid mt-6">
        <ActiveCasesByBranchChart data={branchCaseTrend} />
        <CommunicationFunnelChart data={communicationFunnel} />
      </div>
    </>
  )




  // frontend show

  return (
    <div className="reports-page -m-6 space-y-6 p-6">
      {/* Group 1 — Category cards */}
      <div className="reports-section surface-card rounded-xl p-5">
        <CategoryCards
          cards={CATEGORY_CARDS}
          selectedCategory={selectedCategory}
          categoryMetrics={categoryMetrics}
          filters={filters}
          onSelectCategory={selectCategory}
          onRefresh={refreshPageContent}
          isRefreshing={isLoading || isLibraryLoading}
        />
      </div>

      {/* Group 2 — Tabs + analytics content */}
      <div className="reports-section surface-card rounded-xl p-5 space-y-6">
        {renderTabsAndActions()}

        {activeTab === 'Overview' && (
          <div ref={overviewAnalyticsRef} className="reports-analytics-area">
            {renderKpis()}
            <div className="reports-chart-grid">
              <ChannelConversionChart data={channelConversionData} />
              <BucketWiseTrendChart data={bucketWiseTrendData} />
              <CollectionTrendChart data={collectionTrendData} />
              <RecoveryDistributionChart data={recoveryDistributionData} />
            </div>
            <div className="mt-6 space-y-6">
              {renderTrends()}
            </div>

          </div>
        )}

        {activeTab === 'Detailed Reports' && (
          <section>
            <h3 className="mb-4 text-[15px] font-bold text-[var(--color-navy)]">Raw DCSP Tables</h3>

            {/* CASES GROUP */}
            <div className="mb-6">
              <h4 className="mb-2 text-[12px] font-bold uppercase text-[var(--color-ink-muted)]">📋 Cases</h4>
              <div className="flex flex-wrap gap-2">
                {['dpd-cases', 'bounce-cases'].map((table) => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => selectReportTable(table as ReportTableKey)}
                    className={`rounded-lg border px-4 py-2 text-left transition-all ${activeTable === table ? 'border-[var(--color-navy)] bg-[var(--color-navy)] text-white shadow-md' : 'border-[rgba(5,0,88,0.12)] bg-white text-[var(--color-navy)] hover:bg-[var(--color-ice)]'}`}
                  >
                    <div className="text-[12px] font-bold">{prettyTitle(table)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* OTHER TABLES */}
            <div>
              <h4 className="mb-2 text-[12px] font-bold uppercase text-[var(--color-ink-muted)]">📊 Other Tables</h4>
              <div className="flex flex-wrap gap-2">
                {reportTables.filter(t => !['dpd-cases', 'bounce-cases', 'communication_logs'].includes(t)).map((table) => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => selectReportTable(table as ReportTableKey)}
                    className={`rounded-lg border px-4 py-2 text-left transition-all ${activeTable === table ? 'border-[var(--color-navy)] bg-[var(--color-navy)] text-white shadow-md' : 'border-[rgba(5,0,88,0.12)] bg-white text-[var(--color-navy)] hover:bg-[var(--color-ice)]'}`}
                  >
                    <div className="text-[12px] font-bold">{prettyTitle(table)}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Group 3 — Tables */}
      {activeTab === 'Detailed Reports' && (
        <div className="space-y-6">
          <div ref={detailedReportsRef} className="reports-section surface-card rounded-xl p-5 reports-analytics-area">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="no-print">
                <h3 className="text-[15px] font-bold text-[var(--color-navy)]">Table Data</h3>
                <p className="text-[12px] text-[var(--color-ink-muted)]">Filtered rows from selected DCSP table</p>
              </div>
              <div className="no-print flex flex-col gap-3 md:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-ink-muted)]" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search any value..." className="min-w-[240px] rounded-xl border border-[rgba(5,0,88,0.12)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-gold)] focus:outline-none" />
                </div>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-ink-muted)]" />
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="min-w-[160px] rounded-xl border border-[rgba(5,0,88,0.12)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-gold)] focus:outline-none">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
                <button type="button" onClick={resetDetailedFilters} className="flex items-center gap-2 rounded-xl bg-[var(--color-gold)] px-3 py-2 text-sm font-bold text-[var(--color-navy)] hover:brightness-105">
                  <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[rgba(5,0,88,0.08)]">
              {error && (
                <div className="border-b border-[rgba(206,155,1,0.18)] bg-[rgba(206,155,1,0.1)] px-4 py-3 text-sm text-[var(--color-navy)]">
                  {String(error instanceof Error ? error.message : 'Unable to load table data')}
                </div>
              )}
              <table className="w-full text-left">
                <thead className="bg-[var(--color-ice)]">
                  <tr>
                    {effectiveTableColumns.length > 0 ? effectiveTableColumns.map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-navy)]">{col}</th>
                    )) : <th className="px-4 py-3 text-[10px] font-bold uppercase text-[var(--color-navy)]">No columns</th>}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {isLibraryLoading && !rawTableBundle ? (
                    <tr><td colSpan={Math.max(1, effectiveTableColumns.length)} className="px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
                      <RotateCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--color-gold)]" />Loading...
                    </td></tr>
                  ) : sortedTableRows.length === 0 ? (
                    <tr><td colSpan={Math.max(1, effectiveTableColumns.length)} className="px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">No matching data found.</td></tr>
                  ) : filteredSourceRows.map((row, idx) => (
                    <tr key={idx} className="border-t border-[rgba(5,0,88,0.06)] transition-colors hover:bg-gray-50">
                      {effectiveTableColumns.map((col) => {
                        const raw = safeToString(row[col])
                        let rendered = raw
                        if (shouldFormatDateColumn(col)) rendered = tryFormatDate(raw)
                        else if (typeof raw === 'string' && looksLikeJsonString(raw)) {
                          try { rendered = stringifyCompact(JSON.parse(raw)) } catch { /* keep raw */ }
                        }
                        return <td key={col} className="max-w-[260px] truncate px-4 py-3 align-top text-[12px] text-[var(--color-navy)]" title={rendered}>{rendered}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-[var(--color-ink-muted)]">
                Showing {detailedTotal === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, detailedTotal)} of {detailedTotal}
              </div>
              <div className="flex items-center gap-2">
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-lg border px-2 py-1.5 text-xs">
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
                <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Prev</button>
                <span className="px-2 text-xs font-medium text-[var(--color-ink-muted)]">{page} / {totalPages}</span>
                <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareOptionsModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onSelect={handleShareSelect}
        mode={activeTab === 'Detailed Reports' ? 'excel' : 'image'}
        isProcessing={shareProcessing}
      />
    </div>
  )
}

export default ReportsPage
