/**
 * Table data transformation and display utilities for the Reports feature.
 *
 * Extracted from ReportsPage to keep the component focused on rendering.
 * All functions here are pure (no side-effects, no React dependencies).
 */

import type { DcspTableRow } from '../types'

// ---------------------------------------------------------------------------
// Row flattening – defensive unwrapping for inconsistent API shapes
// ---------------------------------------------------------------------------

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Some backend responses wrap each row's real fields inside a single nested
 * key (e.g. `{ values: { case_id: "...", bucket: "..." } }`). This function
 * detects that shape and unwraps it so downstream logic works against the
 * real fields. Already-flat rows are returned unchanged.
 */
export const flattenRow = (row: DcspTableRow): DcspTableRow => {
  if (!isPlainObject(row)) return row

  const keys = Object.keys(row)
  if (keys.length !== 1) return row

  const onlyValue = (row as Record<string, unknown>)[keys[0]]

  if (isPlainObject(onlyValue)) return onlyValue as DcspTableRow
  if (Array.isArray(onlyValue) && onlyValue.length === 1 && isPlainObject(onlyValue[0])) {
    return onlyValue[0] as DcspTableRow
  }

  return row
}

export const flattenRows = (rows: DcspTableRow[]): DcspTableRow[] => rows.map(flattenRow)

// ---------------------------------------------------------------------------
// String / value formatting helpers
// ---------------------------------------------------------------------------

export const looksLikeJsonString = (s: string): boolean => {
  const trimmed = s.trim()
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))
}

export const stringifyCompact = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  if (Array.isArray(value)) {
    return value
      .slice(0, 5)
      .map((v) => {
        if (v === null || v === undefined) return ''
        if (typeof v === 'object') return '[Object]'
        return String(v)
      })
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return entries
      .slice(0, 6)
      .map(([k, v]) => {
        if (v === null || v === undefined) return `${k}:`
        if (typeof v === 'object') return `${k}:[Object]`
        return `${k}:${String(v)}`
      })
      .join(', ')
  }

  return String(value)
}

export const safeToString = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  if (typeof value === 'string') {
    if (looksLikeJsonString(value)) {
      try {
        return stringifyCompact(JSON.parse(value))
      } catch {
        return value
      }
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') return stringifyCompact(value)

  return String(value)
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export const tryFormatDate = (value: string): string => {
  if (!value) return ''
  const isoCandidate = value.trim()

  const parsed = new Date(isoCandidate)
  if (Number.isNaN(parsed.getTime())) return value

  if (/^\d{4}-\d{2}-\d{2}$/.test(isoCandidate)) {
    return parsed.toLocaleDateString('en-IN')
  }

  return parsed.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const shouldFormatDateColumn = (column: string): boolean =>
  column === 'created_at' || column === 'updated_at'

// ---------------------------------------------------------------------------
// Column labels & ordering (Cases table)
// ---------------------------------------------------------------------------

export const CASES_KEY_TO_LABEL: Record<string, string> = {
  case_id: 'Case ID',
  case_number: 'Case Number',
  pr_number: 'PR Number',
  loan_number: 'Loan Number',
  customer_id: 'Customer ID',
  journey_type: 'Journey Type',
  bucket: 'Bucket',
  dpd: 'DPD',
  strategy_id: 'Strategy ID',
  assigned_to: 'Assigned To',
  outstanding_principal: 'Outstanding Principal',
  outstanding_interest: 'Outstanding Interest',
  outstanding_total: 'Outstanding Total',
  status: 'Status',
  branch: 'Branch',
  zone: 'Zone',
  state: 'State',
  created_at: 'Created At',
  updated_at: 'Updated At',
}

export const CASES_COLUMN_ORDER = [
  'case_id', 'case_number', 'pr_number', 'loan_number', 'customer_id',
  'journey_type', 'bucket', 'dpd', 'strategy_id', 'assigned_to',
  'outstanding_principal', 'outstanding_interest', 'outstanding_total',
  'status', 'branch', 'zone', 'state', 'created_at', 'updated_at',
]

// ---------------------------------------------------------------------------
// Chart data builders
// ---------------------------------------------------------------------------

export const COLORS = ['#000182', '#CE9B01', '#050058', '#D9EAF5', '#7c8ca6']

export const prettyTitle = (table: string): string =>
  table
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export const pickChartKey = (table: string, columns: string[]): string => {
  const preferred: Record<string, RegExp> = {
    cases: /bucket|status|journey|branch|zone|state/i,
    payments: /payment_mode|payment_source|payment_status/i,
    communications: /channel|status|response_status/i,
    strategies: /strategy_name|status|bucket|journey_type/i,
    agents: /role|branch|zone|state|status/i,
    allocations: /role|allocation_status/i,
    ptps: /honoured|agent_id/i,
    'audit-logs': /action|entity_type|user_name/i,
  }

  const pattern =
    preferred[table] ??
    /status|mode|channel|role|branch|zone|state|bucket|journey|type|name|source|action|entity/i
  return columns.find((column) => pattern.test(column)) ?? columns[0] ?? ''
}

export const buildChartData = (
  rows: DcspTableRow[],
  table: string,
  columns: string[],
): Array<{ name: string; value: number; color: string }> => {
  if (!rows.length || !columns.length) return []
  const keyColumn = pickChartKey(table, columns)
  const counts = new Map<string, number>()

  rows.forEach((row) => {
    const key = safeToString(row[keyColumn]) || 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
}

// ---------------------------------------------------------------------------
// Breakdown config (per-table dual-pie charts)
// ---------------------------------------------------------------------------

export const BREAKDOWN_CONFIG: Record<
  string,
  { primary: RegExp; secondary: RegExp; primaryTitle: string; secondaryTitle: string }
> = {
  cases: {
    primary: /bucket/i,
    secondary: /status/i,
    primaryTitle: 'Cases by Bucket',
    secondaryTitle: 'Cases by Status',
  },
  payments: {
    primary: /payment_mode/i,
    secondary: /payment_status/i,
    primaryTitle: 'Payments by Mode',
    secondaryTitle: 'Payments by Status',
  },
  communications: {
    primary: /channel/i,
    secondary: /response_status/i,
    primaryTitle: 'Communications by Channel',
    secondaryTitle: 'Communications by Response',
  },
}

export const buildBreakdown = (
  rows: DcspTableRow[],
  columns: string[],
  pattern: RegExp,
): Array<{ name: string; value: number; color: string }> => {
  const column = columns.find((item) => pattern.test(item))
  if (!column) return []

  const summary = new Map<string, number>()
  rows.forEach((row) => {
    const key = safeToString(row[column]) || 'Unknown'
    summary.set(key, (summary.get(key) ?? 0) + 1)
  })

  return Array.from(summary.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
}
