// Custom hook that manages state and fetches data for the analytics dashboard.

import { useEffect, useMemo, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { DateRangeOption } from '@/features/reports/types'
import { getDefaultCustomFromDate, getDefaultCustomToDate } from '@/Components/dateFilter'
import { safeToString, getBranchName } from '@/features/reports/utils/tableUtils'
import { fetchReportTableBundle } from '@/features/reports/utils/reportDataUtils'
import { extractBranchOptions, extractZoneOptions, extractStateOptions, EMPTY_BUNDLE } from '@/features/reports/utils/reportFilterEngine'

export function useAnalytics() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateRangeOption>('Last 6 Months')
  const [customFromDate, setCustomFromDate] = useState<string>(getDefaultCustomFromDate())
  const [customToDate, setCustomToDate] = useState<string>(getDefaultCustomToDate())
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [zoneFilter, setZoneFilter] = useState<string>('')
  const [stateFilter, setStateFilter] = useState<string>('')
  // const [zoneFilter, setZoneFilter] = useState<string>('')

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
    queryFn: () => fetchReportTableBundle(200, ['branches', 'dpd-cases']),
    placeholderData: (prev) => prev,
  })

  const normalize = (s?: string) => (s ?? '').toString().trim().replace(/\s+/g, ' ')
  const branchMapRef = useRef<Map<string, string>>(new Map())

  const branchOptions = useMemo(() => extractBranchOptions(tableBundle ?? EMPTY_BUNDLE()), [tableBundle])

  const zoneOptions = useMemo(() => extractZoneOptions(tableBundle ?? EMPTY_BUNDLE()), [tableBundle])

  const stateOptions = useMemo(() => extractStateOptions(tableBundle ?? EMPTY_BUNDLE()).filter(s => {
    if (!branchFilter && !zoneFilter) return true
    const normalize = (v?: string) => (v ?? '').toString().trim().replace(/\s+/g, ' ')
    // when branch/zone selected, filter available states accordingly
    return tableBundle?.['dpd-cases']?.some((row: any) => {
      const rowState = safeToString(row.state).trim()
      const rowBranch = getBranchName(row) || safeToString(row.branch_name).trim()
      const rowZone = safeToString(row.zone || row.zone_code).trim()
      if (!rowState) return false
      if (branchFilter && normalize(rowBranch) !== normalize(branchFilter)) return false
      if (zoneFilter && normalize(rowZone) !== normalize(zoneFilter)) return false
      return normalize(rowState) === normalize(s)
    })
  }), [tableBundle, branchFilter, zoneFilter])

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

  // useEffect(() => {
  //   if (zoneFilter && !zoneOptions.includes(zoneFilter)) {
  //     setZoneFilter('')
  //   }
  // }, [zoneOptions, zoneFilter])

  useEffect(() => {
    if (stateFilter && !stateOptions.includes(stateFilter)) {
      setStateFilter('')
    }
  }, [stateOptions, stateFilter])

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ['analyticsDashboard', selectedDateFilter, customFromDate, customToDate, branchFilter, zoneFilter, stateFilter],
    queryFn: async () => {
      const branchForApi = branchFilter ? (branchMapRef.current.get(branchFilter) ?? branchFilter) : undefined
      console.debug('[Analytics] fetching dashboard with branchForApi=', branchForApi, 'branchFilter=', branchFilter, 'zone=', zoneFilter, 'state=', stateFilter)
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
