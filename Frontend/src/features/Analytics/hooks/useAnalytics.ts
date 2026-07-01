// Custom hook that manages state and fetches data for the analytics dashboard.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '@/features/reports/services/reportsService'
import { analyticsService } from '../services/analyticsService'
import type { DateRangeOption } from '@/features/reports/types'
import { getDefaultCustomFromDate, getDefaultCustomToDate } from '@/features/reports/utils/dateFilter'
import type { DcspTableRow } from '@/features/reports/types'
import { safeToString } from '@/features/reports/utils/tableUtils'

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

  const { data: caseTableRows } = useQuery({
    queryKey: ['analyticsCaseOptions'],
    queryFn: async () => {
      const response = await reportsService.fetchTable('cases', 1, 200)
      return response.items
    },
    placeholderData: (prev) => prev,
  })

  const branchOptions = useMemo(() => {
    const values = new Set<string>()
    ;(caseTableRows ?? []).forEach((row: DcspTableRow) => {
      const rowState = safeToString(row.state).trim()
      const rowZone = safeToString(row.zone).trim()
      const rowBranch = safeToString(row.branch).trim()

      if (stateFilter && rowState !== stateFilter) return
      if (zoneFilter && rowZone !== zoneFilter) return

      if (rowBranch) values.add(rowBranch)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [caseTableRows, stateFilter, zoneFilter])

  const zoneOptions = useMemo(() => {
    const values = new Set<string>()
    ;(caseTableRows ?? []).forEach((row: DcspTableRow) => {
      const rowState = safeToString(row.state).trim()
      const rowZone = safeToString(row.zone).trim()
      const rowBranch = safeToString(row.branch).trim()

      if (stateFilter && rowState !== stateFilter) return
      if (branchFilter && rowBranch !== branchFilter) return

      if (rowZone) values.add(rowZone)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [caseTableRows, stateFilter, branchFilter])

  const stateOptions = useMemo(() => {
    const values = new Set<string>()
    ;(caseTableRows ?? []).forEach((row: DcspTableRow) => {
      const rowState = safeToString(row.state).trim()
      const rowZone = safeToString(row.zone).trim()
      const rowBranch = safeToString(row.branch).trim()

      if (zoneFilter && rowZone !== zoneFilter) return
      if (branchFilter && rowBranch !== branchFilter) return

      if (rowState) values.add(rowState)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [caseTableRows, zoneFilter, branchFilter])

  // Automatically reset filters if the selected value is no longer in the filtered options list
  useMemo(() => {
    if (branchFilter && !branchOptions.includes(branchFilter)) {
      setBranchFilter('')
    }
  }, [branchOptions, branchFilter])

  useMemo(() => {
    if (zoneFilter && !zoneOptions.includes(zoneFilter)) {
      setZoneFilter('')
    }
  }, [zoneOptions, zoneFilter])

  useMemo(() => {
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
