import { fetchWithFallback, unwrap } from '@/lib/apiClient'
import type { DcspPagedResult, DcspTableRow } from '../types'

/** Maps URL-friendly table keys to their backend endpoint segment. */
const ENDPOINTS = {
  cases: 'cases',
  payments: 'payments',
  communications: 'communications',
  strategies: 'strategies',
  agents: 'agents',
  allocations: 'allocations',
  ptps: 'ptps',
  'audit-logs': 'audit-logs',
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
