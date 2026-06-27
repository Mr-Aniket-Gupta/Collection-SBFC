// Analytics Custom Hook

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { DateFilterOption } from '../types/analytics.types'

export function useAnalytics() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterOption>('This Month')

  const dateFilterOptions: DateFilterOption[] = [
    'This Month',
    'Last 7 Days',
    'Last 30 Days',
    'Last Quarter',
    'This Year',
  ]

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ['analyticsDashboard', selectedDateFilter],
    queryFn: () => analyticsService.fetchDashboard(selectedDateFilter),
    placeholderData: (prev) => prev,
  })

  const handleRefresh = () => {
    refetch()
  }

  return {
    selectedDateFilter,
    setSelectedDateFilter,
    dateFilterOptions,
    isRefreshing: isFetching,
    dashboard: data,
    error,
    handleRefresh,
  }
}
