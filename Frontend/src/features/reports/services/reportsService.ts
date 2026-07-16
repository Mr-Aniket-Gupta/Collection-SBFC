// This service handles all API calls related to report tables. 
// It requests paginated data from the appropriate backend endpoint and returns the processed response for use in the UI.

import { fetchWithFallback, unwrap } from '@/lib/apiClient'
import type { DcspPagedResult, DcspTableRow } from '../types'

const ENDPOINTS = {
  strategies: 'strategies',
  'strategy-execution-log': 'strategy-execution-log',
  'dpd-cases': 'dpd-cases',
  'bounce-cases': 'bounce-cases',
  payments: 'payments',
  communication_logs: 'communication_logs',
  ptps: 'ptps',
  branches: 'branches',
  agents: 'agents',
} as const

export type ReportEndpointKey = keyof typeof ENDPOINTS

export const reportsService = {
  async fetchTable(
    tableKey: ReportEndpointKey,
    page = 1,
    limit = 25,
  ): Promise<DcspPagedResult<DcspTableRow>> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await fetchWithFallback(`/api/reports/${ENDPOINTS[tableKey]}?${query.toString()}`)
    return unwrap<DcspPagedResult<DcspTableRow>>(response)
  },
}
