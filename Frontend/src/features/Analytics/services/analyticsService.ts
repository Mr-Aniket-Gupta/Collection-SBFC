import { fetchWithFallback, unwrap } from '@/lib/apiClient'
import type { AnalyticsDashboardPayload, DateFilterOption } from '../types/analytics.types'

export const analyticsService = {
  async fetchDashboard(dateFilter: DateFilterOption): Promise<AnalyticsDashboardPayload> {
    const query = new URLSearchParams({ dateFilter })
    const response = await fetchWithFallback(`/api/analytics/dashboard?${query.toString()}`)
    return unwrap<AnalyticsDashboardPayload>(response)
  },
}
