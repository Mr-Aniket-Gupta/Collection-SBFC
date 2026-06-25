import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services/reportsService'
import { FilterState, ReportItem } from '../types'

const initialFilters: FilterState = {
  category: 'All',
  status: 'All',
  search: '',
  page: 1,
  limit: 15,
  sortBy: 'createdDate',
  sortOrder: 'desc'
}

export const useReports = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  // React Query fetch
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reportsList', filters],
    queryFn: () => reportsService.fetchReports(filters),
    placeholderData: (prev) => prev
  })

  const setCategory = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category, page: 1 }))
  }, [])

  const setStatus = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  const setSorting = useCallback((sortBy: keyof ReportItem) => {
    setFilters((prev) => {
      const isSame = prev.sortBy === sortBy
      const sortOrder = isSame && prev.sortOrder === 'desc' ? 'asc' : 'desc'
      return { ...prev, sortBy, sortOrder }
    })
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  return {
    filters,
    reports: data?.reports || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    setCategory,
    setStatus,
    setSearch,
    setPage,
    setLimit,
    setSorting,
    resetFilters
  }
}
export type UseReportsReturn = ReturnType<typeof useReports>
