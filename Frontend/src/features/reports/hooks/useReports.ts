// table data fetch, pagination & state management


import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services/reportsService'
import { flattenRows } from '../utils/tableUtils'
import type { DcspTableRow } from '../types'

export type ReportTableKey =
  | 'strategies'
  | 'strategy-approval-log'
  | 'strategy-steps'
  | 'strategy-execution-log'
  | 'agents'
  | 'pre-emi-cases'
  | 'dpd-cases'
  | 'bounce-cases'

  | 'payments'
  | 'communications'
  | 'allocations'
  | 'ptps'
  | 'audit-logs'
  | 'branches'

export const REPORT_TABLES: ReportTableKey[] = [
  'strategies',
  'strategy-approval-log',
  'strategy-steps',
  'strategy-execution-log',
  'agents',
  'pre-emi-cases',
  'dpd-cases',
  'bounce-cases',
  // 'cases',
  'payments',
  'communications',
  'allocations',
  'ptps',
  'audit-logs',
  'branches',
]
const defaultTable: ReportTableKey = 'strategies'

const normalizeTableKey = (value?: string | null): ReportTableKey => {
  if (value && REPORT_TABLES.includes(value as ReportTableKey)) {
    return value as ReportTableKey
  }

  return defaultTable
}

export const useReports = (initialTable?: string | null) => {
  const [activeTable, setActiveTable] = useState<ReportTableKey>(normalizeTableKey(initialTable))
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setActiveTable(normalizeTableKey(initialTable))
  }, [initialTable])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dcspTable', activeTable, page, limit],
    queryFn: () => reportsService.fetchTable(activeTable, page, limit),
    placeholderData: (prev) => prev
  })

  const rows = useMemo(() => flattenRows(data?.items ?? []), [data])

  const tableColumns = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []

    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key)
          ordered.push(key)
        }
      })
    })

    return ordered
  }, [rows])

  const reset = useCallback(() => {
    setActiveTable(defaultTable)
    setPage(1)
    setLimit(10)
  }, [])

  return {
    reportTables: REPORT_TABLES,
    activeTable,
    setActiveTable,
    page,
    setPage,
    limit,
    setLimit,
    rows,
    total: data?.total ?? 0,
    tableColumns,
    isLoading,
    error,
    refetch,
    reset
  }
}

export type UseReportsReturn = ReturnType<typeof useReports>
