import type { DcspTableRow, ReportLibraryRow } from '../types'
import { safeToString, shouldFormatDateColumn, tryFormatDate } from './tableUtils'

const pickValue = (row: DcspTableRow, keys: string[]): string => {
  const match = keys.find((key) => safeToString(row[key]).trim())
  return match ? safeToString(row[match]) : ''
}

/** Builds a normalized report-library row from a raw DCSP table row. */
export function makeReportRow(row: DcspTableRow, category: string, index: number): ReportLibraryRow {
  const id =
    pickValue(row, [
      'report_id', 'id', 'case_id', 'payment_id', 'communication_id',
      'strategy_id', 'agent_id', 'allocation_id', 'ptp_id', 'audit_id',
    ]) || `${category.replace(/\s+/g, '-').toUpperCase()}-${index + 1}`

  const name =
    pickValue(row, [
      'report_name', 'name', 'case_number', 'loan_number', 'customer_name',
      'strategy_name', 'template_name', 'action', 'entity_type',
    ]) || `${category} Record`

  const createdBy =
    pickValue(row, ['created_by', 'createdBy', 'assigned_to', 'agent_name', 'user_name', 'owner', 'collector_name']) ||
    'System'

  const rawDate = pickValue(row, ['created_at', 'createdDate', 'created_date', 'updated_at', 'payment_date', 'ptp_date'])
  const status =
    pickValue(row, ['status', 'payment_status', 'response_status', 'allocation_status', 'honoured', 'action']) ||
    'Ready'

  return {
    id,
    name,
    category,
    createdBy,
    date: shouldFormatDateColumn('created_at') && rawDate ? tryFormatDate(rawDate) : rawDate || '-',
    status,
    source: row,
  }
}

/** Filters report rows by search term across report fields and raw row values. */
export function matchesSearch(report: ReportLibraryRow, searchTerm: string): boolean {
  if (!searchTerm) return true
  const rowText = Object.values(report.source).map((val) => safeToString(val)).join(' ')
  const haystack = `${report.name} ${report.id} ${report.category} ${report.createdBy} ${report.status} ${rowText}`.toLowerCase()
  return haystack.includes(searchTerm)
}
