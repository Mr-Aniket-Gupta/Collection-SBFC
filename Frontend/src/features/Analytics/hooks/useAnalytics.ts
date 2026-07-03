// Custom hook that manages state and fetches data for the analytics dashboard.

import { useEffect, useMemo, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { DateRangeOption } from '@/features/reports/types'
import { getDefaultCustomFromDate, getDefaultCustomToDate } from '@/Components/dateFilter'
import { safeToString, getBranchName } from '@/features/reports/utils/tableUtils'
import { fetchReportTableBundle } from '@/features/reports/utils/reportDataUtils'

export function useAnalytics() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateRangeOption>('Last 6 Months')
  const [customFromDate, setCustomFromDate] = useState<string>(getDefaultCustomFromDate())
  const [customToDate, setCustomToDate] = useState<string>(getDefaultCustomToDate())
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [zoneFilter, setZoneFilter] = useState<string>('')
  const [stateFilter, setStateFilter] = useState<string>('')

  const dateFilterOptions: DateRangeOption[] = [
    'This Month',
    'Last 7 Days',
    'Last 30 Days',
    'Last Quarter',
    'Last 6 Months',
    'Custom Range',
  ]

  const { data: tableBundle } = useQuery({
    queryKey: ['analyticsCaseOptions'],
    queryFn: () => fetchReportTableBundle(200),
    placeholderData: (prev) => prev,
  })

  const normalize = (s?: string) => (s ?? '').toString().trim().replace(/\s+/g, ' ')
  const branchMapRef = useRef<Map<string, string>>(new Map())

  const branchOptions = useMemo(() => {
    const buildFromRows = (rows: any[] | undefined) => {
      const seen = new Map<string, string>()
      ;(rows ?? []).forEach((row) => {
        const raw = getBranchName(row) || safeToString(row.branch_name).trim()
        const name = normalize(raw)
        if (name) seen.set(name, name)
      })
      return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
    }

    // Also build a mapping from display name -> raw DB value (first seen)
    const branchMap = new Map<string, string>()
    const buildFromRowsWithMap = (rows: any[] | undefined) => {
      const seen = new Map<string, string>()
      ;(rows ?? []).forEach((row) => {
        // prefer the raw DB column for API equality; fall back to getBranchName
        const dbRaw = (safeToString((row ?? {}).branch_name).trim() || safeToString((row ?? {}).name).trim() || safeToString((row ?? {}).branch).trim() || safeToString((row ?? {}).hub_branch_name).trim())
        const displayCandidate = getBranchName(row) || dbRaw || ''
        const name = normalize(displayCandidate)
        if (name && !seen.has(name)) {
          seen.set(name, name)
          // store the raw DB value when available, otherwise store the candidate
          branchMap.set(name, dbRaw || displayCandidate)
        }
      })
      return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
    }

    const values = buildFromRowsWithMap(tableBundle?.branches)
    if (values.length > 0) {
      branchMapRef.current = branchMap
      return values
    }

    const fallback = buildFromRowsWithMap(tableBundle?.['dpd-cases'])
    branchMapRef.current = branchMap
    return fallback
  }, [tableBundle])

  const zoneOptions = useMemo(() => ['East', 'West', 'North', 'South'], [])

  const stateOptions = useMemo(() => {
    const values = new Set<string>()
    ;(tableBundle?.['dpd-cases'] ?? []).forEach((row) => {
      const rowState = safeToString(row.state).trim()
      const rowBranch = getBranchName(row) || safeToString(row.branch_name).trim()

      if (zoneFilter) return
      if (branchFilter && normalize(rowBranch) !== normalize(branchFilter)) return

      if (rowState) values.add(rowState)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [tableBundle, zoneFilter, branchFilter])

  // Automatically reset filters if the selected value is no longer in the filtered options list
  useEffect(() => {
    if (branchFilter && !branchOptions.includes(branchFilter)) {
      setBranchFilter('')
    }
  }, [branchOptions, branchFilter])

  useEffect(() => {
    if (zoneFilter && !zoneOptions.includes(zoneFilter)) {
      setZoneFilter('')
    }
  }, [zoneOptions, zoneFilter])

  useEffect(() => {
    if (stateFilter && !stateOptions.includes(stateFilter)) {
      setStateFilter('')
    }
  }, [stateOptions, stateFilter])

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ['analyticsDashboard', selectedDateFilter, customFromDate, customToDate, branchFilter, zoneFilter, stateFilter],
    queryFn: async () => {
      const branchForApi = branchFilter ? (branchMapRef.current.get(branchFilter) ?? branchFilter) : undefined
      console.debug('[Analytics] fetching dashboard with branchForApi=', branchForApi, 'branchFilter=', branchFilter)
      const resp = await analyticsService.fetchDashboard(selectedDateFilter, customFromDate, customToDate, branchForApi, zoneFilter, stateFilter)
      console.debug('[Analytics] dashboard response:', resp)
      return resp
    },
    placeholderData: (prev) => prev,
  })

  const handleRefresh = () => {
    resetFilters()
    refetch()
  }

  const resetFilters = () => {
    setSelectedDateFilter('Last 6 Months')
    setCustomFromDate(getDefaultCustomFromDate())
    setCustomToDate(getDefaultCustomToDate())
    setBranchFilter('')
    setZoneFilter('')
    setStateFilter('')
  }

  return {
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
    dateFilterOptions,
    isRefreshing: isFetching,
    dashboard: data,
    error,
    handleRefresh,
    resetFilters,
  }
}
