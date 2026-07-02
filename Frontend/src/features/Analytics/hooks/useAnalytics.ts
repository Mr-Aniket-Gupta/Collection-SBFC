// Custom hook that manages state and fetches data for the analytics dashboard.

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { DateRangeOption } from '@/features/reports/types'
import { getDefaultCustomFromDate, getDefaultCustomToDate } from '@/features/reports/utils/dateFilter'
import { safeToString } from '@/features/reports/utils/tableUtils'
import { fetchReportTableBundle } from '@/features/reports/utils/reportDataUtils'

export function useAnalytics() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateRangeOption>('This Month')
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

  const branchOptions = useMemo(() => {
    const values = new Set<string>()
    ;(tableBundle?.cases ?? []).forEach((row) => {
      const rowState = safeToString(row.state).trim()
      const rowZone = safeToString(row.zone).trim()
      const rowBranch = safeToString(row.branch).trim()

      if (stateFilter && rowState !== stateFilter) return
      if (zoneFilter && rowZone !== zoneFilter) return

      if (rowBranch) values.add(rowBranch)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [tableBundle, stateFilter, zoneFilter])

  const zoneOptions = useMemo(() => {
    const values = new Set<string>()
    ;(tableBundle?.cases ?? []).forEach((row) => {
      const rowState = safeToString(row.state).trim()
      const rowZone = safeToString(row.zone).trim()
      const rowBranch = safeToString(row.branch).trim()

      if (stateFilter && rowState !== stateFilter) return
      if (branchFilter && rowBranch !== branchFilter) return

      if (rowZone) values.add(rowZone)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [tableBundle, stateFilter, branchFilter])

  const stateOptions = useMemo(() => {
    const values = new Set<string>()
    ;(tableBundle?.cases ?? []).forEach((row) => {
      const rowState = safeToString(row.state).trim()
      const rowZone = safeToString(row.zone).trim()
      const rowBranch = safeToString(row.branch).trim()

      if (zoneFilter && rowZone !== zoneFilter) return
      if (branchFilter && rowBranch !== branchFilter) return

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
    queryFn: () => analyticsService.fetchDashboard(selectedDateFilter, customFromDate, customToDate, branchFilter, zoneFilter, stateFilter),
    placeholderData: (prev) => prev,
  })

  const handleRefresh = () => {
    refetch()
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
  }
}
