// table data fetch, pagination & state management


import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services/reportsService'
import type { DcspTableRow } from '../types'

export type ReportTableKey = 'cases' | 'payments' | 'communications' | 'strategies' | 'agents' | 'allocations' | 'ptps' | 'audit-logs'

export const REPORT_TABLES: ReportTableKey[] = ['cases', 'payments', 'communications', 'strategies', 'agents', 'allocations', 'ptps', 'audit-logs']
const defaultTable: ReportTableKey = 'cases'

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

  const tableColumns = useMemo(() => {
    const first = data?.items?.[0] as DcspTableRow | undefined
    return first ? Object.keys(first) : []
  }, [data])

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
    rows: data?.items ?? [],
    total: data?.total ?? 0,
    tableColumns,
    isLoading,
    error,
    refetch,
    reset
  }
}

export type UseReportsReturn = ReturnType<typeof useReports>
