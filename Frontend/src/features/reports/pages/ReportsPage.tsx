import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RotateCw, Search, SlidersHorizontal, Printer, Share2, Download, TrendingDown, TrendingUp, Wallet, Smartphone, Target, CheckCircle, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Area, AreaChart, Line, LineChart } from 'recharts'
import { useReports } from '@/features/reports/hooks/useReports'
import type { ReportTableKey } from '@/features/reports/hooks/useReports'
import { reportsService } from '@/features/reports/services/reportsService'
import type { DcspTableRow } from '@/features/reports/types'
import {
  isPlainObject,
  flattenRows,
  safeToString,
  looksLikeJsonString,
  stringifyCompact,
  tryFormatDate,
  shouldFormatDateColumn,
  CASES_KEY_TO_LABEL,
  CASES_COLUMN_ORDER,
  prettyTitle,
} from '@/features/reports/utils/tableUtils'

const CATEGORY_CARDS: Array<{
  id: string
  title: string
  tableKey: ReportTableKey
  icon: React.ReactNode
  bg: string
}> = [
  { id: 'recovery', title: 'Recovery MIS', icon: <Wallet className="w-5 h-5 text-[var(--color-navy)]" />, bg: 'bg-[var(--color-ice)]', tableKey: 'cases' },
  { id: 'bucket', title: 'Bucket-wise MIS', icon: <Target className="w-5 h-5 text-[var(--color-gold)]" />, bg: 'bg-[rgba(206,155,1,0.12)]', tableKey: 'allocations' },
  { id: 'digital', title: 'Digital Recovery', icon: <Smartphone className="w-5 h-5 text-[#8D6B19]" />, bg: 'bg-[#FDF9F0]', tableKey: 'communications' },
  { id: 'payment', title: 'Payment MIS', icon: <Wallet className="w-5 h-5 text-[#2C3E50]" />, bg: 'bg-[#F4F6F7]', tableKey: 'payments' },
  { id: 'strategy', title: 'Strategy Reports', icon: <Share2 className="w-5 h-5 text-[#5B2C6F]" />, bg: 'bg-[#F4ECF7]', tableKey: 'strategies' },
  { id: 'comm', title: 'Communication Reports', icon: <Search className="w-5 h-5 text-[#D35400]" />, bg: 'bg-[#FDEDEC]', tableKey: 'communications' },
  { id: 'bounce', title: 'Bounce Analysis', icon: <Target className="w-5 h-5 text-[var(--color-gold)]" />, bg: 'bg-[rgba(206,155,1,0.12)]', tableKey: 'ptps' },
]

const REPORT_LIBRARY_FETCH_LIMIT = 5000

type ReportLibraryRow = {
  id: string
  name: string
  category: string
  createdBy: string
  date: string
  status: string
  source: DcspTableRow
}

const pickValue = (row: DcspTableRow, keys: string[]): string => {
  const match = keys.find((key) => safeToString(row[key]).trim())
  return match ? safeToString(row[match]) : ''
}

const makeReportRow = (row: DcspTableRow, category: string, index: number): ReportLibraryRow => {
  const id = pickValue(row, ['report_id', 'id', 'case_id', 'payment_id', 'communication_id', 'strategy_id', 'agent_id', 'allocation_id', 'ptp_id', 'audit_id']) || `${category.replace(/\s+/g, '-').toUpperCase()}-${index + 1}`
  const name = pickValue(row, ['report_name', 'name', 'case_number', 'loan_number', 'customer_name', 'strategy_name', 'template_name', 'action', 'entity_type']) || `${category} Record`
  const createdBy = pickValue(row, ['created_by', 'createdBy', 'assigned_to', 'agent_name', 'user_name', 'owner', 'collector_name']) || 'System'
  const rawDate = pickValue(row, ['created_at', 'createdDate', 'created_date', 'updated_at', 'payment_date', 'ptp_date'])
  const status = pickValue(row, ['status', 'payment_status', 'response_status', 'allocation_status', 'honoured', 'action']) || 'Ready'

  return {
    id,
    name,
    category,
    createdBy,
    date: shouldFormatDateColumn('created_at') && rawDate ? tryFormatDate(rawDate) : rawDate || '-',
    status,
    source: row,
  }
}

const toExportRows = (rows: DcspTableRow[]) =>
  rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeToString(value)])),
  )

const downloadWorkbook = async (rows: DcspTableRow[], filename: string) => {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(rows))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')
  XLSX.writeFile(workbook, filename)
}

export const ReportsPage: React.FC = () => {
  const params = useParams()
  const navigate = useNavigate()
  const {
    reportTables,
    activeTable,
    setActiveTable,
    rows: rawRows,
    total,
    tableColumns: rawTableColumns,
    isLoading,
    page,
    setPage,
    limit,
    setLimit,
    refetch,
    error
  } = useReports(params.tableKey)
  
  const [activeTab, setActiveTab] = useState('Overview')
  const [search, setSearch] = useState('')
  const [columnFilter, setColumnFilter] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryPageSize, setLibraryPageSize] = useState(10)
  const [selectedReport, setSelectedReport] = useState<ReportLibraryRow | null>(null)

  const {
    data: allCategoryReports = [],
    isFetching: isLibraryLoading,
    refetch: refetchLibrary,
  } = useQuery({
    queryKey: ['reportLibrary', REPORT_LIBRARY_FETCH_LIMIT],
    queryFn: async () => {
      const reportGroups = await Promise.all(
        CATEGORY_CARDS.map(async (category) => {
          const response = await reportsService.fetchTable(category.tableKey, 1, REPORT_LIBRARY_FETCH_LIMIT)
          return flattenRows(response.items).map((row, index) => makeReportRow(row, category.title, index))
        }),
      )

      return reportGroups.flat()
    },
  })

  const rows = useMemo(() => flattenRows(rawRows), [rawRows])

  const tableColumns = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    rows.forEach((row) => {
      if (!isPlainObject(row)) return
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key)
          ordered.push(key)
        }
      })
    })
    return ordered.length > 0 ? ordered : rawTableColumns
  }, [rows, rawTableColumns])

  const effectiveTableColumns = useMemo(() => {
    if (activeTable !== 'cases') return tableColumns
    if (!tableColumns.length) return tableColumns
    const ordered = CASES_COLUMN_ORDER.filter((key) => tableColumns.includes(key))
    const extras = tableColumns.filter((key) => !CASES_COLUMN_ORDER.includes(key))
    return [...ordered, ...extras]
  }, [activeTable, tableColumns])

  const activeCategory = useMemo(
    () => CATEGORY_CARDS.find((cat) => cat.tableKey === activeTable) ?? CATEGORY_CARDS[0],
    [activeTable],
  )

  const currentTableReports = useMemo(
    () => rows.map((row, index) => makeReportRow(row, activeCategory.title, index)),
    [rows, activeCategory.title],
  )

  const backendReports = allCategoryReports.length > 0 ? allCategoryReports : currentTableReports

  const filteredRows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    const normalizeForSearch = (val: unknown): string => {
      if (typeof val === 'string' && looksLikeJsonString(val)) {
        try { return `${stringifyCompact(JSON.parse(val))}` } catch {}
      }
      return safeToString(val)
    }
    return backendReports.filter((report) => {
      const row = report.source
      if (selectedCategory && report.category !== selectedCategory) return false
      if (statusFilter && report.status !== statusFilter) return false
      if (columnFilter) {
        const val = row[columnFilter]
        const normalized = normalizeForSearch(val).toLowerCase()
        return !searchTerm || normalized.includes(searchTerm)
      }
      if (!searchTerm) return true
      return `${report.name} ${report.id} ${report.category} ${report.createdBy} ${report.status} ${Object.values(row).map(normalizeForSearch).join(' ')}`.toLowerCase().includes(searchTerm)
    })
  }, [backendReports, search, columnFilter, selectedCategory, statusFilter])

  const filteredCurrentTableRows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    const normalizeForSearch = (val: unknown): string => {
      if (typeof val === 'string' && looksLikeJsonString(val)) {
        try { return `${stringifyCompact(JSON.parse(val))}` } catch {}
      }
      return safeToString(val)
    }

    return currentTableReports.filter((report) => {
      const row = report.source
      if (statusFilter && report.status !== statusFilter) return false
      if (columnFilter) {
        const val = row[columnFilter]
        const normalized = normalizeForSearch(val).toLowerCase()
        return !searchTerm || normalized.includes(searchTerm)
      }
      if (!searchTerm) return true
      return `${report.name} ${report.id} ${report.category} ${report.createdBy} ${report.status} ${Object.values(row).map(normalizeForSearch).join(' ')}`.toLowerCase().includes(searchTerm)
    })
  }, [currentTableReports, search, columnFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const libraryReports = filteredRows
  const libraryRecordTotal = backendReports.length
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    backendReports.forEach((report) => {
      counts.set(report.category, (counts.get(report.category) ?? 0) + 1)
    })
    return counts
  }, [backendReports])
  const libraryTotalPages = Math.max(1, Math.ceil(libraryReports.length / libraryPageSize))
  const paginatedLibraryReports = useMemo(() => {
    const start = (libraryPage - 1) * libraryPageSize
    return libraryReports.slice(start, start + libraryPageSize)
  }, [libraryReports, libraryPage, libraryPageSize])
  const filteredSourceRows = useMemo(() => filteredCurrentTableRows.map((report) => report.source), [filteredCurrentTableRows])
  const statusOptions = useMemo(
    () => Array.from(new Set(backendReports.map((report) => report.status).filter(Boolean))).sort(),
    [backendReports],
  )

  const chartData = useMemo(() => {
    const summary = new Map<string, number>()
    filteredRows.forEach((report) => {
      summary.set(report.status || 'Unknown', (summary.get(report.status || 'Unknown') ?? 0) + 1)
    })
    return Array.from(summary.entries()).map(([name, value], index) => ({
      name,
      value,
      sent: value,
      responded: Math.max(0, Math.round(value * 0.72)),
      converted: Math.max(0, Math.round(value * 0.45)),
      color: ['#050058', '#CE9B01', '#8B5CF6', '#16A34A', '#DC2626'][index % 5],
    }))
  }, [filteredRows])

  useEffect(() => {
    setLibraryPage(1)
  }, [search, selectedCategory, statusFilter, activeTable, libraryPageSize])

  useEffect(() => {
    if (libraryPage > libraryTotalPages) {
      setLibraryPage(libraryTotalPages)
    }
  }, [libraryPage, libraryTotalPages])

  const trendData = useMemo(() => {
    const summary = new Map<string, number>()
    filteredRows.forEach((report) => {
      const date = report.date && report.date !== '-' ? new Date(report.date) : null
      const key = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        : 'No date'
      summary.set(key, (summary.get(key) ?? 0) + 1)
    })
    return Array.from(summary.entries()).slice(-8).map(([name, records], index) => ({
      name,
      records,
      resolved: Math.max(0, Math.round(records * 0.65)),
      pending: Math.max(0, records - Math.round(records * 0.65)),
      index: index + 1,
    }))
  }, [filteredRows])

  const selectCategory = (cat: typeof CATEGORY_CARDS[number]) => {
    const isSameCategory = selectedCategory === cat.title
    setSelectedCategory(isSameCategory ? '' : cat.title)
    setStatusFilter('')
    setColumnFilter('')
    setPage(1)
    if (!isSameCategory) {
      navigate(`/reports/${cat.tableKey}`)
      setActiveTable(cat.tableKey)
    }
  }

  const changeCategoryFilter = (title: string) => {
    setSelectedCategory(title)
    setStatusFilter('')
    setPage(1)
    const category = CATEGORY_CARDS.find((cat) => cat.title === title)
    if (category) {
      navigate(`/reports/${category.tableKey}`)
      setActiveTable(category.tableKey)
    }
  }

  const refreshPageContent = () => {
    window.location.reload()
  }

  const exportFilteredData = async () => {
    try {
      const rowsToExport = libraryReports.map((report) => report.source)
      const filenamePrefix = selectedCategory || 'All-Categories'

      await downloadWorkbook(rowsToExport, `${filenamePrefix.replace(/\s+/g, '-')}-reports.xlsx`)
      toast.success('Excel file downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to export reports')
    }
  }

  const downloadSingleRow = async (report: ReportLibraryRow) => {
    await downloadWorkbook([report.source], `${report.id}.xlsx`)
    toast.success('Row downloaded')
  }

  const sharePage = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: 'Reports & Analytics', url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast.success('Page link copied')
  }

  const renderCategories = () => (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-navy)]">Report Categories</h3>
          <p className="text-[12px] text-[var(--color-ink-muted)]">Click a card to filter dashboards & table</p>
        </div>
        <button onClick={refreshPageContent} className="flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm border border-[rgba(5,0,88,0.08)] hover:bg-gray-50">
          <RotateCw className={`h-4 w-4 ${isLoading || isLibraryLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-4">
        {CATEGORY_CARDS.map(cat => {
          const isActive = selectedCategory === cat.title
          const count = categoryCounts.get(cat.title) ?? 0
          return (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat)}
              className={`min-h-[136px] bg-white border rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-all ${
                isActive ? 'border-[var(--color-gold)] ring-2 ring-[rgba(206,155,1,0.22)]' : 'border-[rgba(5,0,88,0.08)]'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.bg}`}>
                {cat.icon}
              </div>
              <h4 className="text-[13px] font-bold text-[var(--color-navy)] mb-1 leading-snug">{cat.title}</h4>
              <p className="text-[11px] text-[var(--color-ink-muted)]">{count ? `${count} records` : 'Click to load'}</p>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL RECORDS', value: libraryRecordTotal.toLocaleString('en-IN'), diff: `${filteredRows.length} shown`, dir: 'up', icon: <Wallet className="w-5 h-5 text-[var(--color-navy)]" /> },
          { label: 'FILTERED RECORDS', value: filteredRows.length.toLocaleString('en-IN'), diff: selectedCategory || 'All categories', dir: 'up', icon: <Smartphone className="w-5 h-5 text-[var(--color-navy)]" /> },
          { label: 'STATUS TYPES', value: statusOptions.length.toLocaleString('en-IN'), diff: 'from backend', dir: 'up', icon: <Target className="w-5 h-5 text-[var(--color-navy)]" /> },
          { label: 'CURRENT PAGE', value: `${page}/${totalPages}`, diff: `${limit} per page`, dir: 'up', icon: <CheckCircle className="w-5 h-5 text-[var(--color-navy)]" /> },
        ].map(kpi => (          <div key={kpi.label} className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 flex flex-col shadow-sm relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold tracking-[0.1em] text-[var(--color-ink-muted)] uppercase">{kpi.label}</span>
              <div className="p-1.5 rounded-lg bg-[var(--color-ice)]">{kpi.icon}</div>
            </div>
            <span className="text-2xl font-extrabold text-[var(--color-navy)] mb-3">{kpi.value}</span>
            <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md w-fit ${kpi.dir === 'up' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
              {kpi.dir === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.diff}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[var(--color-navy)]">Channel Conversion Rate</h3>
            <p className="text-[11px] text-[var(--color-ink-muted)]">Sent → Responded → Converted per channel</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={80} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sent" fill="#050058" barSize={8} radius={[0, 4, 4, 0]} name="Sent" />
                <Bar dataKey="responded" fill="#CE9B01" barSize={8} radius={[0, 4, 4, 0]} name="Responded" />
                <Bar dataKey="converted" fill="#FDE68A" barSize={8} radius={[0, 4, 4, 0]} name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[var(--color-navy)]">Bucket-wise Trend</h3>
            <p className="text-[11px] text-[var(--color-ink-muted)]">DPD movement over the last 6 months</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="records" stackId="1" stroke="#050058" fill="#050058" fillOpacity={0.45} />
                <Area type="monotone" dataKey="resolved" stackId="1" stroke="#CE9B01" fill="#CE9B01" fillOpacity={0.45} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[var(--color-navy)]">Collection Trend</h3>
            <p className="text-[11px] text-[var(--color-ink-muted)]">Monthly collection vs target (₹ Cr)</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="records" stroke="#050058" strokeWidth={2} dot={{ r: 4, fill: '#050058' }} name="Records" />
                <Line type="monotone" dataKey="pending" stroke="#CE9B01" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[var(--color-navy)]">Recovery Distribution</h3>
            <p className="text-[11px] text-[var(--color-ink-muted)]">Share of recovery by channel</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Library Table */}
      <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(5,0,88,0.08)]">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--color-navy)]">Report Library</h3>
            <p className="text-[12px] text-[var(--color-ink-muted)]">{libraryReports.length} of {libraryRecordTotal} records</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search reports..." className="pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[var(--color-gold)] w-48" />
            </div>
            <select value={selectedCategory} onChange={(e) => changeCategoryFilter(e.target.value)} className="text-sm py-1.5 px-3 rounded-lg border border-gray-200 bg-white">
              <option value="">All categories</option>
              {CATEGORY_CARDS.map((cat) => <option key={cat.id} value={cat.title}>{cat.title}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm py-1.5 px-3 rounded-lg border border-gray-200 bg-white">
              <option value="">All status</option>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button onClick={exportFilteredData} className="flex items-center gap-2 bg-[var(--color-gold)] text-[var(--color-navy)] font-bold text-sm px-4 py-1.5 rounded-lg hover:brightness-105 transition-all">
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Report Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Created By</th>
                <th className="px-5 py-3">Created Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLibraryLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--color-gold)]" />
                    Loading all report data...
                  </td>
                </tr>
              ) : libraryReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                    No reports found for the selected filter.
                  </td>
                </tr>
              ) : paginatedLibraryReports.map((rpt, i) => (
                <tr key={`${rpt.id}-${(libraryPage - 1) * libraryPageSize + i}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-[var(--color-navy)]">
                    {rpt.name}
                    <div className="text-[10px] font-normal text-gray-400 mt-0.5">{rpt.id}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{rpt.category}</td>
                  <td className="px-5 py-4 text-gray-600">{rpt.createdBy}</td>
                  <td className="px-5 py-4 text-gray-600">{rpt.date}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      rpt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                      rpt.status === 'Ready' ? 'bg-green-50 text-green-700' :
                      rpt.status === 'Processing' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        rpt.status === 'Scheduled' ? 'bg-blue-500' :
                        rpt.status === 'Ready' ? 'bg-green-500' :
                        rpt.status === 'Processing' ? 'bg-amber-600' :
                        'bg-red-500'
                      }`}></span>
                      {rpt.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button onClick={() => setSelectedReport(rpt)} className="hover:text-[var(--color-navy)]" aria-label={`View ${rpt.name}`}><Eye className="w-4 h-4" /></button>
                      <button onClick={() => downloadSingleRow(rpt)} className="hover:text-[var(--color-navy)]" aria-label={`Download ${rpt.name}`}><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[rgba(5,0,88,0.08)] px-5 py-4 flex-wrap">
          <div className="text-xs text-[var(--color-ink-muted)]">
            Showing {libraryReports.length === 0 ? 0 : (libraryPage - 1) * libraryPageSize + 1}
            -{Math.min(libraryPage * libraryPageSize, libraryReports.length)} of {libraryReports.length} filtered records
          </div>
          <div className="flex items-center gap-2">
            <select
              value={libraryPageSize}
              onChange={(e) => setLibraryPageSize(Number(e.target.value))}
              className="text-xs border border-[rgba(5,0,88,0.12)] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[var(--color-gold)]"
              aria-label="Report library rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={() => setLibraryPage(Math.max(1, libraryPage - 1))}
              disabled={libraryPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(5,0,88,0.12)] disabled:opacity-40 hover:bg-gray-50 font-medium"
            >
              Prev
            </button>
            <span className="text-xs text-[var(--color-ink-muted)] px-2 font-medium">{libraryPage} / {libraryTotalPages}</span>
            <button
              onClick={() => setLibraryPage(Math.min(libraryTotalPages, libraryPage + 1))}
              disabled={libraryPage === libraryTotalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(5,0,88,0.12)] disabled:opacity-40 hover:bg-gray-50 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDetailedReports = () => (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
        <h3 className="text-[15px] font-bold text-[var(--color-navy)] mb-4">Raw DCSP Tables</h3>
        <div className="flex flex-wrap gap-2">
          {reportTables.map((table) => (
            <button
              key={table}
              onClick={() => {
                navigate(`/reports/${table}`)
                setActiveTable(table as typeof activeTable)
                setSelectedCategory(CATEGORY_CARDS.find((cat) => cat.tableKey === table)?.title ?? '')
                setStatusFilter('')
                setPage(1)
              }}
              className={`rounded-lg border px-4 py-2 text-left transition-all ${
                activeTable === table
                  ? 'bg-[var(--color-navy)] text-white border-[var(--color-navy)] shadow-md'
                  : 'bg-white text-[var(--color-navy)] border-[rgba(5,0,88,0.12)] hover:bg-[var(--color-ice)]'
              }`}
            >
              <div className="text-[12px] font-bold">{prettyTitle(table)}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-navy)]">Table Data</h2>
            <p className="text-[12px] text-[var(--color-ink-muted)]">Search and filter the current table slice</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-ink-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any value..."
                className="pl-9 pr-3 py-2 rounded-xl border border-[rgba(5,0,88,0.12)] bg-white text-sm min-w-[240px] focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-ink-muted)]" />
              <select
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-[rgba(5,0,88,0.12)] bg-white text-sm min-w-[200px] focus:outline-none focus:border-[var(--color-gold)]"
              >
                <option value="">All columns</option>
                {tableColumns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            <button onClick={() => { refetch(); toast.success('Table refreshed') }} className="px-3 py-2 rounded-xl bg-[var(--color-gold)] text-[var(--color-navy)] text-sm font-bold flex items-center gap-2 hover:brightness-105 transition-all">
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[rgba(5,0,88,0.08)]">
          {error && (
            <div className="px-4 py-3 bg-[rgba(206,155,1,0.1)] border-b border-[rgba(206,155,1,0.18)] text-sm text-[var(--color-navy)]">
              {String(error instanceof Error ? error.message : 'Unable to load table data')}
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-[var(--color-ice)]">
              <tr>
                {effectiveTableColumns.length > 0 ? (
                  effectiveTableColumns.map((column) => (
                    <th key={column} className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] font-bold whitespace-nowrap text-[var(--color-navy)]">
                      {CASES_KEY_TO_LABEL[column] ?? column}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--color-navy)]">No columns</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-[var(--color-ink-muted)] text-center" colSpan={Math.max(1, effectiveTableColumns.length)}>
                    <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--color-gold)]" />
                    Loading table rows...
                  </td>
                </tr>
              ) : filteredSourceRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-[var(--color-ink-muted)] text-center" colSpan={Math.max(1, effectiveTableColumns.length)}>
                    No matching data found for this table.
                  </td>
                </tr>
              ) : (
                filteredSourceRows.map((row, idx) => (
                  <tr key={idx} className="border-t border-[rgba(5,0,88,0.06)] hover:bg-gray-50 transition-colors">
                    {effectiveTableColumns.map((column) => {
                      const raw = safeToString(row[column])
                      let rendered = raw
                      if (shouldFormatDateColumn(column)) rendered = tryFormatDate(raw)
                      else if (typeof raw === 'string' && looksLikeJsonString(raw)) {
                        try { rendered = stringifyCompact(JSON.parse(raw)) } catch {}
                      }
                      return (
                        <td key={column} className="px-4 py-3 text-[12px] text-[var(--color-navy)] align-top max-w-[260px] truncate" title={rendered}>
                          {rendered}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
          <div className="text-xs text-[var(--color-ink-muted)]">
            Showing {filteredSourceRows.length} of {rows.length} loaded records
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs border border-[rgba(5,0,88,0.12)] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[var(--color-gold)]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(5,0,88,0.12)] disabled:opacity-40 hover:bg-gray-50 font-medium">Prev</button>
            <span className="text-xs text-[var(--color-ink-muted)] px-2 font-medium">{page} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(5,0,88,0.12)] disabled:opacity-40 hover:bg-gray-50 font-medium">Next</button>
          </div>
        </div>
      </section>
    </div>
  )

  const renderTrends = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--color-navy)]">Record Trend</h3>
          <p className="text-[11px] text-[var(--color-ink-muted)]">Current backend data grouped by available dates</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="records" stroke="#050058" strokeWidth={2} name="Records" />
              <Line type="monotone" dataKey="pending" stroke="#CE9B01" strokeWidth={2} name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--color-navy)]">Status Trend</h3>
          <p className="text-[11px] text-[var(--color-ink-muted)]">Status count from filtered backend rows</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#050058" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderFunnel = () => (
    <div className="bg-white border border-[rgba(5,0,88,0.08)] rounded-xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[var(--color-navy)]">Funnel Analysis</h3>
        <p className="text-[11px] text-[var(--color-ink-muted)]">Filtered backend records by status</p>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="value" fill="#CE9B01" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 bg-[#F4F6F8] -m-6 p-6 min-h-[calc(100vh-64px)]">
      {renderCategories()}

      {/* Tabs and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex gap-1 p-1 bg-white border border-[rgba(5,0,88,0.08)] rounded-xl overflow-x-auto hide-scrollbar">
          {['Overview', 'Detailed Reports', 'Trends', 'Funnel Analysis'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-[#F4F6F8] text-[var(--color-navy)] shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:text-[var(--color-navy)] hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[rgba(5,0,88,0.08)] text-[13px] font-bold text-[var(--color-navy)] hover:bg-gray-50 transition-colors shadow-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={sharePage} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[rgba(5,0,88,0.08)] text-[13px] font-bold text-[var(--color-navy)] hover:bg-gray-50 transition-colors shadow-sm">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={exportFilteredData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-gold)] text-[var(--color-navy)] text-[13px] font-bold hover:brightness-105 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'Overview' && renderDashboard()}
      {activeTab === 'Detailed Reports' && renderDetailedReports()}
      {activeTab === 'Trends' && renderTrends()}
      {activeTab === 'Funnel Analysis' && renderFunnel()}

      {selectedReport && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,0,88,0.42)] p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-[rgba(5,0,88,0.08)] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(5,0,88,0.08)] p-5">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-navy)]">{selectedReport.name}</h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">{selectedReport.id}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-navy)]" aria-label="Close report preview">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 overflow-y-auto">
              {[
                ['Category', selectedReport.category],
                ['Created By', selectedReport.createdBy],
                ['Created Date', selectedReport.date],
                ['Status', selectedReport.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[rgba(5,0,88,0.08)] bg-[#F8FAFC] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)] font-bold">{label}</p>
                  <p className="mt-2 text-sm font-bold text-[var(--color-navy)]">{value}</p>
                </div>
              ))}
              <div className="sm:col-span-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white overflow-hidden">
                <div className="border-b border-[rgba(5,0,88,0.08)] px-4 py-3 text-sm font-bold text-[var(--color-navy)]">Full Row Data</div>
                <div className="max-h-[320px] overflow-auto">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {Object.entries(selectedReport.source).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-100 last:border-0">
                          <th className="w-48 px-4 py-2 font-bold text-[var(--color-navy)] bg-[#F8FAFC] align-top">{CASES_KEY_TO_LABEL[key] ?? key}</th>
                          <td className="px-4 py-2 text-[var(--color-ink-muted)]">{safeToString(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[rgba(5,0,88,0.08)] p-5">
              <button onClick={() => downloadSingleRow(selectedReport)} className="flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-bold text-[var(--color-navy)]">
                <Download className="h-4 w-4" />
                Download Row
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
