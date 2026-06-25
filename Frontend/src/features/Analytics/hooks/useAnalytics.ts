// ─── Analytics Custom Hook ────────────────────────────────────────────────────

import { useState } from 'react'
import type { DateFilterOption } from '../types/analytics.types'

export function useAnalytics() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterOption>('This Month')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const dateFilterOptions: DateFilterOption[] = [
    'This Month',
    'Last 7 Days',
    'Last 30 Days',
    'Last Quarter',
    'This Year',
  ]

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate API refresh
    setTimeout(() => setIsRefreshing(false), 1200)
  }

  return {
    selectedDateFilter,
    setSelectedDateFilter,
    dateFilterOptions,
    isRefreshing,
    handleRefresh,
  }
}
