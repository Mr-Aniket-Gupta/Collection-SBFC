import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RotateCw, Search, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { REPORT_CATEGORIES_CONFIG } from '@/features/reports/constants'
import { useReports } from '@/features/reports/hooks/useReports'
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
  COLORS,
  prettyTitle,
  buildChartData,
  BREAKDOWN_CONFIG,
  buildBreakdown,
} from '@/features/reports/utils/tableUtils'


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
    reset,
    error
  } = useReports(params.tableKey)
  const [search, setSearch] = useState('')
  const [columnFilter, setColumnFilter] = useState('')

  // Unwrap rows that the backend nested under a single key (e.g. { values: {...} })
  const rows = useMemo(() => flattenRows(rawRows), [rawRows])

  // Derive columns from the flattened rows instead of trusting the hook's
  // tableColumns blindly — if rows were wrapped, rawTableColumns would just
  // be ["values"] and every downstream feature would break.
  const tableColumns = useMemo(() => {
    const wasFlattened = rows.some((row, idx) => row !== rawRows[idx])
    if (!wasFlattened) return rawTableColumns

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
    return ordered
  }, [rows, rawRows, rawTableColumns])

  const effectiveTableColumns = useMemo(() => {
    if (activeTable !== 'cases') return tableColumns
    if (!tableColumns.length) return tableColumns

    const ordered = CASES_COLUMN_ORDER.filter((key) => tableColumns.includes(key))
    const extras = tableColumns.filter((key) => !CASES_COLUMN_ORDER.includes(key))
    return [...ordered, ...extras]
  }, [activeTable, tableColumns])

  const filteredRows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    const normalizeForSearch = (val: unknown): string => {
      if (typeof val === 'string' && looksLikeJsonString(val)) {
        try {
          return `${stringifyCompact(JSON.parse(val))}`
        } catch {
          // fall back to raw string
        }
      }
      return safeToString(val)
    }

    return rows.filter((row) => {
      const entries = Object.entries(row).map(([key, value]) => {
        const normalized = normalizeForSearch(value).toLowerCase()
        return `${key}:${normalized}`
      })

      return (
        (!searchTerm || entries.some((value) => value.includes(searchTerm))) &&
        (!columnFilter ||
          entries.some(
            (value) =>
              value.startsWith(`${columnFilter.toLowerCase()}:`) && value.includes(searchTerm || '')
          ))
      )
    })
  }, [rows, search, columnFilter])

  const chartData = useMemo(
    () => buildChartData(rows, activeTable, effectiveTableColumns),
    [rows, activeTable, effectiveTableColumns],
  )

  const tableBreakdowns = useMemo(() => {
    const config = BREAKDOWN_CONFIG[activeTable]
    if (!config) return []
    return [
      { title: config.primaryTitle, data: buildBreakdown(rows, tableColumns, config.primary) },
      { title: config.secondaryTitle, data: buildBreakdown(rows, tableColumns, config.secondary) },
    ]
  }, [rows, tableColumns, activeTable])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const tableMeta = REPORT_CATEGORIES_CONFIG.find((item) => item.id === activeTable)

  const goToTable = (table: string) => {
    navigate(`/reports/${table}`)
    setActiveTable(table as typeof activeTable)
    setPage(1)
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Reports refreshed')
  }

  const clearFilters = () => {
    setSearch('')
    setColumnFilter('')
    reset()
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--color-navy)]">
      {/* Page Header */}
      <section className="surface-card rounded-2xl p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 border border-[rgba(5,0,88,0.08)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]">DCSP Tables</p>
          <h1 className="text-[28px] font-bold text-[var(--color-navy)] mt-1">
            {prettyTitle(activeTable)} View
          </h1>
          <p className="text-[13px] text-[var(--color-ink-muted)] mt-1 max-w-2xl">
            {tableMeta?.label ?? prettyTitle(activeTable)} data rendered directly from `dcsp.{activeTable.replace('-', '_')}`.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-full xl:min-w-[420px]">
          <div className="rounded-xl bg-[var(--color-ice)] border border-[rgba(5,0,88,0.08)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] font-bold">Table</p>
            <p className="text-sm font-bold truncate">{activeTable}</p>
          </div>
          <div className="rounded-xl bg-[rgba(206,155,1,0.12)] border border-[rgba(206,155,1,0.18)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] font-bold">Rows</p>
            <p className="text-sm font-bold">{total}</p>
          </div>
          <div className="rounded-xl bg-white border border-[rgba(5,0,88,0.08)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] font-bold">Page</p>
            <p className="text-sm font-bold">{page}/{totalPages}</p>
          </div>
        </div>
      </section>

      {/* Table Selector */}
      <section className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {reportTables.map((table) => (
            <button
              key={table}
              onClick={() => goToTable(table)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                activeTable === table
                  ? 'bg-[var(--color-navy)] text-white border-[var(--color-navy)] shadow-md'
                  : 'bg-white text-[var(--color-navy)] border-[rgba(5,0,88,0.12)] hover:bg-[var(--color-ice)]'
              }`}
            >
              <div className="text-[12px] font-bold">{prettyTitle(table)}</div>
              <div className="text-[10px] opacity-70">dcsp.{table.replace('-', '_')}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Charts: Mini View + Quick Count */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Mini View</h2>
              <p className="text-[12px] text-[var(--color-ink-muted)]">Current table slice summary</p>
            </div>
            <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.18)]">
              {prettyTitle(activeTable)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Quick Count</h2>
              <p className="text-[12px] text-[var(--color-ink-muted)]">Visualized by current grouping key</p>
            </div>
            <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.18)]">
              Chart
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#000182" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Breakdowns (conditional) */}
      {tableBreakdowns.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tableBreakdowns.map((item) => (
            <div key={item.title} className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold">{item.title}</h2>
                  <p className="text-[12px] text-[var(--color-ink-muted)]">Breakdown from current table rows</p>
                </div>
                <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.18)]">
                  Breakdown
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={item.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4}>
                    {item.data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </section>
      )}

      {/* Data Table */}
      <section className="surface-card rounded-2xl p-5 border border-[rgba(5,0,88,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold">Table Data</h2>
            <p className="text-[12px] text-[var(--color-ink-muted)]">Search and filter the current table slice</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-ink-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any value..."
                className="pl-9 pr-3 py-2 rounded-xl border border-[rgba(5,0,88,0.12)] bg-white text-sm min-w-[240px]"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-ink-muted)]" />
              <select
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-[rgba(5,0,88,0.12)] bg-white text-sm min-w-[200px]"
              >
                <option value="">All columns</option>
                {tableColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleRefresh} className="px-3 py-2 rounded-xl bg-[var(--color-gold)] text-[var(--color-navy)] text-sm font-bold">
              <RotateCw className={`inline w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={clearFilters} className="px-3 py-2 rounded-xl border border-[rgba(5,0,88,0.12)] text-sm font-semibold">
              Reset
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
                    <th
                      key={column}
                      className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] font-bold whitespace-nowrap"
                    >
                      {CASES_KEY_TO_LABEL[column] ?? column}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] font-bold">No columns</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-[var(--color-ink-muted)]" colSpan={Math.max(1, effectiveTableColumns.length)}>
                    Loading table rows...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-[var(--color-ink-muted)]" colSpan={Math.max(1, effectiveTableColumns.length)}>
                    No matching data found for this table.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={idx} className="border-t border-[rgba(5,0,88,0.06)]">
                    {effectiveTableColumns.map((column) => {
                      const raw = safeToString(row[column])

                      const rendered = (() => {
                        if (shouldFormatDateColumn(column)) return tryFormatDate(raw)

                        if (typeof raw === 'string' && looksLikeJsonString(raw)) {
                          try {
                            return stringifyCompact(JSON.parse(raw))
                          } catch {
                            return raw
                          }
                        }

                        return raw
                      })()

                      return (
                        <td
                          key={column}
                          className="px-4 py-3 text-[12px] text-[var(--color-navy)] align-top max-w-[260px] truncate"
                          title={rendered}
                        >
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

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
          <div className="text-xs text-[var(--color-ink-muted)]">
            Showing {filteredRows.length} of {rows.length} loaded records
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs border border-[rgba(5,0,88,0.12)] rounded-lg px-2 py-1.5 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ReportsPage
