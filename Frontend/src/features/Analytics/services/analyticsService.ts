// Service layer for fetching analytics data from the backend API.

import { fetchWithFallback, unwrap } from '@/lib/apiClient'
import type { AnalyticsDashboardPayload } from '../types/analytics.types'

export const analyticsService = {
  async fetchDashboard(dateFilter: string, customFrom?: string, customTo?: string, branch?: string, zone?: string, state?: string): Promise<AnalyticsDashboardPayload> {
    const params: Record<string, string> = { dateFilter }
    if (customFrom) params.customFromDate = customFrom
    if (customTo) params.customToDate = customTo
    if (branch) params.branch = branch
    if (zone) params.zone = zone
    if (state) params.state = state

    const query = new URLSearchParams(params)
    const response = await fetchWithFallback(`/api/analytics/dashboard?${query.toString()}`)
    return unwrap<AnalyticsDashboardPayload>(response)
  },
}
