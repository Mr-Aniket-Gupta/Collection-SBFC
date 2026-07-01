import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  RotateCw, Search, Printer, Share2, Download, TrendingDown, TrendingUp,
  Wallet, Smartphone, Target, CheckCircle, Eye, X, ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useReports } from '@/features/reports/hooks/useReports'
import type { ReportTableKey } from '@/features/reports/hooks/useReports'
import type { DateRangeOption, DcspTableRow, ReportLibraryRow, SortOrder } from '@/features/reports/types'
import { CategoryCards, type CategoryCardConfig } from '@/features/reports/components/CategoryCards'
import { ShareOptionsModal, type ShareOption } from '@/features/reports/components/ShareOptionsModal'
import {
  ChannelConversionChart,
  BucketWiseTrendChart,
  CollectionTrendChart,
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
import { DEFAULT_DATE_RANGE } from '@/features/reports/utils/dateFilter'
import { captureElementAsPng, downloadBlob, printElement, shareElementAsImage } from '@/features/reports/utils/captureUtils'
import { downloadMultiSheetWorkbook, downloadWorkbook, shareExcelWorkbook, toExportRows } from '@/features/reports/utils/excelExport'
import { buildMisCardMetrics, groupTableRowsFromBundle } from '@/features/reports/utils/misCardMetrics'
import {
  applyCategoryGlobalFilter,
  countBundleRows,
  EMPTY_BUNDLE,
  filterBundleByDateRange,
} from '@/features/reports/utils/reportFilterEngine'
import { buildReportsFromBundle, fetchReportTableBundle } from '@/features/reports/utils/reportDataUtils'
import { makeReportRow, matchesSearch } from '@/features/reports/utils/reportHelpers'
import {
  CASES_KEY_TO_LABEL,
  CASES_COLUMN_ORDER,
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
const DATE_STORAGE_KEY = 'reportsDateRange.v2'

const CATEGORY_CARDS: CategoryCardConfig[] = [
  { id: 'recovery', title: 'Recovery MIS', tableKey: 'payments', icon: <Wallet className="h-5 w-5 text-[var(--color-navy)]" />, accent: 'bg-[var(--color-navy)]', iconBg: 'bg-[var(--color-ice)]' },
  { id: 'bucket', title: 'Bucket-wise MIS', tableKey: 'strategies', icon: <Target className="h-5 w-5 text-[var(--color-gold)]" />, accent: 'bg-[var(--color-gold)]', iconBg: 'bg-[rgba(206,155,1,0.12)]' },
  { id: 'digital', title: 'Digital Recovery', tableKey: 'payments', icon: <Smartphone className="h-5 w-5 text-[#8D6B19]" />, accent: 'bg-[#8D6B19]', iconBg: 'bg-[#FDF9F0]' },
  { id: 'payment', title: 'Payment MIS', tableKey: 'payments', icon: <Wallet className="h-5 w-5 text-[#2C3E50]" />, accent: 'bg-[#2C3E50]', iconBg: 'bg-[#F4F6F7]' },
  { id: 'strategy', title: 'Strategy Reports', tableKey: 'strategies', icon: <Share2 className="h-5 w-5 text-[#5B2C6F]" />, accent: 'bg-[#5B2C6F]', iconBg: 'bg-[#F4ECF7]' },
  { id: 'comm', title: 'Communication Reports', tableKey: 'communications', icon: <Search className="h-5 w-5 text-[#D35400]" />, accent: 'bg-[#D35400]', iconBg: 'bg-[#FDEDEC]' },
  { id: 'bounce', title: 'Bounce Analysis', tableKey: 'payments', icon: <Target className="h-5 w-5 text-[var(--color-gold)]" />, accent: 'bg-[var(--color-gold)]', iconBg: 'bg-[rgba(206,155,1,0.12)]' },
]

const TABS = ['Overview', 'Detailed Reports', 'Trends', 'Funnel Analysis'] as const

const readStoredDateRange = (): DateRangeOption => {
  const stored = sessionStorage.getItem(DATE_STORAGE_KEY)
  const allowed: DateRangeOption[] = ['This Month', 'Last 7 Days', 'Last 30 Days', 'Last Quarter', 'Last 6 Months']
  return allowed.includes(stored as DateRangeOption) ? (stored as DateRangeOption) : DEFAULT_DATE_RANGE
}

export const ReportsPage: React.FC = () => {
  const params = useParams()
  const navigate = useNavigate()
  const overviewAnalyticsRef = useRef<HTMLDivElement>(null)
  const detailedReportsRef = useRef<HTMLDivElement>(null)
  const trendsRef = useRef<HTMLDivElement>(null)
  const funnelRef = useRef<HTMLDivElement>(null)

  const {
    reportTables, activeTable, setActiveTable, rows: rawRows, total,
    tableColumns: rawTableColumns, isLoading, page, setPage, limit, setLimit, refetch, error,
  } = useReports(params.tableKey)

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview')
  const [dateRange, setDateRange] = useState<DateRangeOption>(readStoredDateRange)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryPageSize, setLibraryPageSize] = useState(10)
  const [selectedReport, setSelectedReport] = useState<ReportLibraryRow | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareProcessing, setShareProcessing] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(DATE_STORAGE_KEY, dateRange)
  }, [dateRange])

  const { data: rawTableBundle, isFetching: isLibraryLoading, isError: isLibraryError, refetch: refetchLibrary } = useQuery({
    queryKey: ['reportTableBundle', REPORT_LIBRARY_FETCH_LIMIT],
    queryFn: () => fetchReportTableBundle(REPORT_LIBRARY_FETCH_LIMIT),
  })

  const tableBundle = rawTableBundle ?? EMPTY_BUNDLE()

  const dateFilteredBundle = useMemo(
    () => filterBundleByDateRange(tableBundle, dateRange),
    [tableBundle, dateRange],
  )

  const { bundle: categoryFilteredBundle, context: globalFilterContext } = useMemo(
    () => applyCategoryGlobalFilter(dateFilteredBundle, selectedCategory),
    [dateFilteredBundle, selectedCategory],
  )

  const syncBundle = selectedCategory ? categoryFilteredBundle : dateFilteredBundle

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

  const effectiveTableColumns = useMemo(() => {
    if (activeTable !== 'cases') return tableColumns
    const ordered = CASES_COLUMN_ORDER.filter((key) => tableColumns.includes(key))
    const extras = tableColumns.filter((key) => !CASES_COLUMN_ORDER.includes(key))
    return [...ordered, ...extras]
  }, [activeTable, tableColumns])

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
  const libraryTotalPages = Math.max(1, Math.ceil(filteredRows.length / libraryPageSize))

  const paginatedLibraryReports = useMemo(() => {
    const start = (libraryPage - 1) * libraryPageSize
    return filteredRows.slice(start, start + libraryPageSize)
  }, [filteredRows, libraryPage, libraryPageSize])

  const categoryMetrics = useMemo(
    () => buildMisCardMetrics(
      {
        recovery: 'Recovery MIS',
        bucket: 'Bucket-wise MIS',
        digital: 'Digital Recovery',
        payment: 'Payment MIS',
        strategy: 'Strategy Reports',
        comm: 'Communication Reports',
        bounce: 'Bounce Analysis',
      },
      groupTableRowsFromBundle(syncBundle),
    ),
    [syncBundle],
  )

  const statusOptions = useMemo(
    () => Array.from(new Set(syncReports.map((r) => r.status).filter(Boolean))).sort(),
    [syncReports],
  )

  const chartReports = syncReports

  const channelConversionData = useMemo(() => buildChannelConversionData(chartReports), [chartReports])
  const bucketWiseTrendData = useMemo(() => buildBucketWiseTrendData(chartReports), [chartReports])
  const collectionTrendData = useMemo(() => buildCollectionTrendData(chartReports), [chartReports])
  const recoveryDistributionData = useMemo(() => buildRecoveryDistributionData(chartReports), [chartReports])
  const paymentVolumeTrend = useMemo(() => buildPaymentVolumeTrend(chartReports), [chartReports])
  const branchCaseTrend = useMemo(() => buildBranchCaseTrend(chartReports), [chartReports])
  const communicationFunnel = useMemo(() => buildCommunicationFunnel(chartReports), [chartReports])

  useEffect(() => { setLibraryPage(1) }, [search, selectedCategory, statusFilter, activeTable, libraryPageSize, dateRange])
  useEffect(() => { if (libraryPage > libraryTotalPages) setLibraryPage(libraryTotalPages) }, [libraryPage, libraryTotalPages])

  const selectCategory = (cat: CategoryCardConfig) => {
    const same = selectedCategory === cat.title
    setSelectedCategory(same ? '' : cat.title)
    setStatusFilter('')
    setPage(1)
    if (!same) { navigate(`/reports/${cat.tableKey}`); setActiveTable(cat.tableKey) }
  }

  const changeCategoryFilter = (title: string) => {
    setSelectedCategory(title)
    setStatusFilter('')
    setPage(1)
    const cat = CATEGORY_CARDS.find((c) => c.title === title)
    if (cat) { navigate(`/reports/${cat.tableKey}`); setActiveTable(cat.tableKey) }
  }

  const refreshPageContent = async () => {
    sessionStorage.setItem(DATE_STORAGE_KEY, dateRange)
    await Promise.all([refetchLibrary(), refetch()])
    toast.success('Reports refreshed')
  }

  const getPrintTarget = (): { element: HTMLElement; title: string } | null => {
    if (activeTab === 'Overview' && overviewAnalyticsRef.current) {
      return { element: overviewAnalyticsRef.current, title: `Reports Overview — ${dateRange}` }
    }
    if (activeTab === 'Detailed Reports' && detailedReportsRef.current) {
      return { element: detailedReportsRef.current, title: `Raw DCSP Tables — ${prettyTitle(activeTable)}` }
    }
    if (activeTab === 'Trends' && trendsRef.current) {
      return { element: trendsRef.current, title: `Reports — ${activeTab}` }
    }
    if (activeTab === 'Funnel Analysis' && funnelRef.current) {
      return { element: funnelRef.current, title: `Reports — ${activeTab}` }
    }
    return null
  }

  const resetDetailedFilters = async () => {
    setSearch('')
    setSortOrder('asc')
    setStatusFilter('')
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
    const rowsToExport = filteredRows.map((r) => r.source)
    return [
      {
        name: 'Summary',
        rows: [
          { metric: 'Date Range', value: dateRange },
          { metric: 'Category', value: selectedCategory || 'All' },
          { metric: 'Filtered Records', value: String(filteredRows.length) },
        ],
      },
      { name: 'Report Library', rows: toExportRows(rowsToExport) },
      { name: 'Channel Conversion', rows: channelConversionData.map((d) => ({ channel: d.channel, count: String(d.sent) })) },
      { name: 'Bucket Trend', rows: bucketWiseTrendData.map((d) => ({ month: d.month, '0-30': String(d['0-30']), '31-60': String(d['31-60']), '61-90': String(d['61-90']), '90+': String(d['90+']) })) },
      { name: 'Collection Trend', rows: collectionTrendData.map((d) => ({ month: d.month, success: String(d.success), failed: String(d.failed), pending: String(d.pending) })) },
      { name: 'Recovery Split', rows: recoveryDistributionData.map((d) => ({ name: d.name, percent: String(d.value) })) },
    ].filter((sheet) => sheet.rows.length > 0)
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
        await shareExcelWorkbook(buildDetailedExcelSheets(), filename)
        toast.success('Excel file shared')
        setShareOpen(false)
        return
      }

      const target = getPrintTarget()
      if (!target) {
        toast.error('Nothing to share on this tab')
        return
      }

      const filename = `Reports-${activeTab.replace(/\s+/g, '-')}-${dateRange.replace(/\s+/g, '-')}.png`
      if (option === 'image') {
        await shareElementAsImage(target.element, filename)
        toast.success('Image shared')
      } else {
        const blob = await captureElementAsPng(target.element)
        downloadBlob(blob, filename)
        toast.success('Image downloaded')
      }
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
        await downloadMultiSheetWorkbook(buildExportSheets(), `Reports-${dateRange.replace(/\s+/g, '-')}.xlsx`)
      }
      toast.success('Excel file downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to export reports')
    }
  }

  const handleLibraryExport = async () => {
    try {
      const rowsToExport = filteredRows.map((r) => r.source)
      const prefix = selectedCategory || 'All-Categories'
      await downloadWorkbook(rowsToExport, `${prefix.replace(/\s+/g, '-')}-filtered.xlsx`)
      toast.success(`${rowsToExport.length} records exported`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to export')
    }
  }

  const downloadSingleRow = async (report: ReportLibraryRow) => {
    await downloadWorkbook([report.source], `${report.id}.xlsx`)
    toast.success('Row downloaded')
  }

  const renderKpis = () => (
    <div className="reports-kpi-grid">
      {[
        { label: 'TOTAL RECORDS', value: countBundleRows(syncBundle).toLocaleString('en-IN'), diff: `${filteredRows.length} shown`, dir: 'up' as const, icon: <Wallet className="h-5 w-5 text-[var(--color-navy)]" /> },
        { label: 'FILTERED RECORDS', value: filteredRows.length.toLocaleString('en-IN'), diff: selectedCategory || 'All categories', dir: 'up' as const, icon: <Smartphone className="h-5 w-5 text-[var(--color-navy)]" /> },
        { label: 'STATUS TYPES', value: statusOptions.length.toLocaleString('en-IN'), diff: dateRange, dir: 'up' as const, icon: <Target className="h-5 w-5 text-[var(--color-navy)]" /> },
        { label: 'CURRENT PAGE', value: `${page}/${totalPages}`, diff: `${limit} per page`, dir: 'up' as const, icon: <CheckCircle className="h-5 w-5 text-[var(--color-navy)]" /> },
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
      <div className="hide-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-[rgba(5,0,88,0.08)] bg-[#F8FAFC] p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-[13px] font-bold transition-colors ${activeTab === tab ? 'border border-gray-100 bg-white text-[var(--color-navy)] shadow-sm' : 'text-gray-500 hover:bg-white hover:text-[var(--color-navy)]'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="no-print flex items-center gap-3">
        <button type="button" onClick={handlePrint} className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50">
          <Printer className="h-4 w-4" /> Print
        </button>
        <button type="button" onClick={() => setShareOpen(true)} className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:brightness-105">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
    </div>
  )

  const renderReportLibraryTable = () => (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-navy)]">Report Library</h3>
          <p className="text-[12px] text-[var(--color-ink-muted)]">
            {filteredRows.length} of {syncReports.length} records
            {selectedCategory ? ` — ${selectedCategory}` : ''}
            {globalFilterContext ? ` · ${globalFilterContext.primaryMatchCount} primary matches` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search reports..." className="w-48 rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-sm focus:border-[var(--color-gold)] focus:outline-none" />
          </div>
          <select value={selectedCategory} onChange={(e) => changeCategoryFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
            <option value="">All categories</option>
            {CATEGORY_CARDS.map((cat) => <option key={cat.id} value={cat.title}>{cat.title}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
            <option value="">All status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" onClick={handleLibraryExport} className="flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-1.5 text-sm font-bold text-[var(--color-navy)] hover:brightness-105">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[rgba(5,0,88,0.08)]">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-gray-100 bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              {['Report Name', 'Category', 'Created By', 'Created Date', 'Status', 'Actions'].map((h) => (
                <th key={h} className={`px-5 py-3 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLibraryLoading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                <RotateCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--color-gold)]" />Loading...
              </td></tr>
            ) : paginatedLibraryReports.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">No reports found.</td></tr>
            ) : paginatedLibraryReports.map((rpt, i) => (
              <tr key={`${rpt.id}-${i}`} className="transition-colors hover:bg-gray-50">
                <td className="px-5 py-4 font-semibold text-[var(--color-navy)]">{rpt.name}<div className="mt-0.5 text-[10px] font-normal text-gray-400">{rpt.id}</div></td>
                <td className="px-5 py-4 text-gray-600">{rpt.category}</td>
                <td className="px-5 py-4 text-gray-600">{rpt.createdBy}</td>
                <td className="px-5 py-4 text-gray-600">{rpt.date}</td>
                <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />{rpt.status}</span></td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-gray-400">
                    <button type="button" onClick={() => setSelectedReport(rpt)} aria-label={`View ${rpt.name}`}><Eye className="h-4 w-4 hover:text-[var(--color-navy)]" /></button>
                    <button type="button" onClick={() => downloadSingleRow(rpt)} aria-label={`Download ${rpt.name}`}><Download className="h-4 w-4 hover:text-[var(--color-navy)]" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-[var(--color-ink-muted)]">
          Showing {filteredRows.length === 0 ? 0 : (libraryPage - 1) * libraryPageSize + 1}-{Math.min(libraryPage * libraryPageSize, filteredRows.length)} of {filteredRows.length}
        </div>
        <div className="flex items-center gap-2">
          <select value={libraryPageSize} onChange={(e) => setLibraryPageSize(Number(e.target.value))} className="rounded-lg border border-[rgba(5,0,88,0.12)] bg-white px-2 py-1.5 text-xs">
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
          </select>
          <button type="button" onClick={() => setLibraryPage(Math.max(1, libraryPage - 1))} disabled={libraryPage === 1} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Prev</button>
          <span className="px-2 text-xs font-medium text-[var(--color-ink-muted)]">{libraryPage} / {libraryTotalPages}</span>
          <button type="button" onClick={() => setLibraryPage(Math.min(libraryTotalPages, libraryPage + 1))} disabled={libraryPage === libraryTotalPages} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Next</button>
        </div>
      </div>
    </>
  )

  const renderTrends = () => (
    <div ref={trendsRef} className="reports-analytics-area grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--color-navy)]">Payment Volume Trend</h3>
          <p className="text-[11px] text-[var(--color-ink-muted)]">Monthly payment records from Payment MIS</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paymentVolumeTrend} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke="#050058" strokeWidth={2.5} name="Payments" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--color-navy)]">Active Cases by Branch</h3>
          <p className="text-[11px] text-[var(--color-ink-muted)]">Open cases grouped by branch from Recovery MIS</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchCaseTrend} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={55} interval={0} />
              <YAxis tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#CE9B01" radius={[6, 6, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderFunnel = () => (
    <div ref={funnelRef} className="reports-analytics-area rounded-xl border border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[var(--color-navy)]">Communication Funnel</h3>
        <p className="text-[11px] text-[var(--color-ink-muted)]">Sent → Delivered → Read → Responded → Converted from Communications table</p>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={communicationFunnel} margin={{ top: 10, right: 30, left: 10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={90} />
            <Tooltip formatter={(value, _name, item) => [`${value} (${item.payload.percent}%)`, 'Count']} />
            <Bar dataKey="count" fill="#050058" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <div className="reports-page -m-6 space-y-6 p-6">
      {/* Group 1 — Category cards */}
      <div className="reports-section surface-card rounded-xl p-5">
        {isLibraryError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load report data. Ensure backend is running on port 5166.
          </div>
        )}
        <CategoryCards
          cards={CATEGORY_CARDS}
          selectedCategory={selectedCategory}
          categoryMetrics={categoryMetrics}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
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
          </div>
        )}

        {activeTab === 'Detailed Reports' && (
          <section>
            <h3 className="mb-4 text-[15px] font-bold text-[var(--color-navy)]">Raw DCSP Tables</h3>
            <div className="flex flex-wrap gap-2">
              {reportTables.map((table) => (
                <button
                  key={table}
                  type="button"
                  onClick={() => {
                    navigate(`/reports/${table}`)
                    setActiveTable(table as ReportTableKey)
                    setPage(1)
                  }}
                  className={`rounded-lg border px-4 py-2 text-left transition-all ${activeTable === table ? 'border-[var(--color-navy)] bg-[var(--color-navy)] text-white shadow-md' : 'border-[rgba(5,0,88,0.12)] bg-white text-[var(--color-navy)] hover:bg-[var(--color-ice)]'}`}
                >
                  <div className="text-[12px] font-bold">{prettyTitle(table)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Trends' && renderTrends()}
        {activeTab === 'Funnel Analysis' && renderFunnel()}
      </div>

      {/* Group 3 — Tables */}
      {activeTab === 'Overview' && (
        <div className="reports-section surface-card rounded-xl p-5">
          {renderReportLibraryTable()}
        </div>
      )}

      {activeTab === 'Detailed Reports' && (
        <div ref={detailedReportsRef} className="reports-section surface-card rounded-xl p-5 reports-analytics-area">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[var(--color-navy)]">Raw DCSP Tables</h2>
            <p className="text-[12px] text-[var(--color-ink-muted)]">
              {prettyTitle(activeTable)} — {detailedTotal} records
              {selectedCategory ? ` (filtered by ${selectedCategory})` : ''}
            </p>
          </div>

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
                    <th key={col} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-navy)]">{CASES_KEY_TO_LABEL[col] ?? col}</th>
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
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
              <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Prev</button>
              <span className="px-2 text-xs font-medium text-[var(--color-ink-muted)]">{page} / {totalPages}</span>
              <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Next</button>
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

      {selectedReport && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,0,88,0.42)] p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[rgba(5,0,88,0.08)] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(5,0,88,0.08)] p-5">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-navy)]">{selectedReport.name}</h2>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{selectedReport.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {[['Category', selectedReport.category], ['Created By', selectedReport.createdBy], ['Created Date', selectedReport.date], ['Status', selectedReport.status]].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[rgba(5,0,88,0.08)] bg-[#F8FAFC] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">{label}</p>
                  <p className="mt-2 text-sm font-bold text-[var(--color-navy)]">{value}</p>
                </div>
              ))}
              <div className="overflow-hidden rounded-lg border border-[rgba(5,0,88,0.08)] bg-white sm:col-span-2">
                <div className="border-b border-[rgba(5,0,88,0.08)] px-4 py-3 text-sm font-bold text-[var(--color-navy)]">Full Row Data</div>
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {Object.entries(selectedReport.source).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-100 last:border-0">
                          <th className="w-48 bg-[#F8FAFC] px-4 py-2 align-top font-bold text-[var(--color-navy)]">{CASES_KEY_TO_LABEL[key] ?? key}</th>
                          <td className="px-4 py-2 text-[var(--color-ink-muted)]">{safeToString(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[rgba(5,0,88,0.08)] p-5">
              <button type="button" onClick={() => downloadSingleRow(selectedReport)} className="flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-bold text-[var(--color-navy)]">
                <Download className="h-4 w-4" /> Download Row
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default ReportsPage
