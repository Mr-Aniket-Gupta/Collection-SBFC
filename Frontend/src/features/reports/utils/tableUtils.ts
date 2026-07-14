/**
 * Table data transformation and display utilities for the Reports feature.
 *
 * Extracted from ReportsPage to keep the component focused on rendering.
 * All functions here are pure (no side-effects, no React dependencies).
 */

import type { DcspTableRow } from '../types'

/**
 * Description of what this function does: Checks if value is a plain JavaScript object.
 * Inputs: value: unknown
 * Outputs: boolean
 * Dependencies: none
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Description of what this function does: Unwraps single key nested values objects returned by backend if present.
 * Inputs: row: DcspTableRow
 * Outputs: DcspTableRow
 * Dependencies: isPlainObject
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

/**
 * Description of what this function does: Flattens an array of rows.
 * Inputs: rows: DcspTableRow[]
 * Outputs: DcspTableRow[]
 * Dependencies: flattenRow
 */
export const flattenRows = (rows: DcspTableRow[]): DcspTableRow[] => rows.map(flattenRow)

/**
 * Description of what this function does: Checks if a string looks like a JSON string.
 * Inputs: s: string
 * Outputs: boolean
 * Dependencies: none
 */
export const looksLikeJsonString = (s: string): boolean => {
  const trimmed = s.trim()
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))
}

/**
 * Description of what this function does: Converts an unknown value to a compact string format.
 * Inputs: value: unknown
 * Outputs: string
 * Dependencies: none
 */
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

/**
 * Description of what this function does: Safely converts any value to a readable string representation.
 * Inputs: value: unknown
 * Outputs: string
 * Dependencies: looksLikeJsonString, stringifyCompact
 */
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

/**
 * Description of what this function does: Normalizes a branch name by trailing a standard 'Branch' suffix.
 * Inputs: input: string
 * Outputs: string
 * Dependencies: none
 */
function normalizeBranchName(input: string): string {
  if (!input) return ''
  let name = input.toString().trim().replace(/\s+/g, ' ')
  if (/^branch\s+/i.test(name)) {
    name = name.replace(/^branch\s+/i, '').trim() + ' Branch'
  }
  const parts = name.split(' ').filter(Boolean)
  const nonBranch = parts.filter((p) => !/^branch$/i.test(p))
  if (nonBranch.length === 0) return 'Branch'
  return (nonBranch.join(' ') + (parts.some((p) => /^branch$/i.test(p)) ? ' Branch' : '')).trim()
}

/**
 * Description of what this function does: Extracts branch name from a row safely.
 * Inputs: row: Record<string, unknown> | undefined
 * Outputs: string
 * Dependencies: safeToString, normalizeBranchName
 */
export const getBranchName = (row: Record<string, unknown> | undefined): string => {
  if (!row || typeof row !== 'object') return ''
  const candidates = ['name', 'branch_name', 'branch', 'branchName', 'hub_branch_name']
  for (const key of candidates) {
    const v = (row as Record<string, unknown>)[key]
    const s = safeToString(v).trim()
    if (s) return normalizeBranchName(s)
  }
  const alt = Object.keys(row).find((k) => k.toLowerCase().includes('branch') || k.toLowerCase() === 'name')
  if (alt) return normalizeBranchName(safeToString((row as Record<string, unknown>)[alt]).trim())
  return ''
}

/**
 * Description of what this function does: Safely formats date string into local IN display format.
 * Inputs: value: string
 * Outputs: string
 * Dependencies: none
 */
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

/**
 * Description of what this function does: Checks if column should be formatted as a date.
 * Inputs: column: string
 * Outputs: boolean
 * Dependencies: none
 */
export const shouldFormatDateColumn = (column: string): boolean =>
  column === 'created_at' || column === 'updated_at' || column === 'created_on' || column === 'status_updated_on'

export const CASES_KEY_TO_LABEL: Record<string, string> = {
  case_id: 'Case ID',
  case_number: 'Case Number',
  pr_number: 'PR Number',
  loan_number: 'Loan Number',
  customer_id: 'Customer ID',
  customer_name: 'Customer Name',
  mobile_number: 'Mobile Number',
  alternate_mobile: 'Alternate Mobile',
  email_id: 'Email ID',
  product_name: 'Product Name',
  pre_emi_amount: 'Pre EMI Amount',
  pre_emi_date: 'Pre EMI Date',
  mifin_batch_ref: 'Mifin Batch Ref',
  mifin_extraction_date: 'Mifin Extraction Date',
  dpd_case_id: 'DPD Case ID',
  branch_name: 'Branch Name',
  disbursal_date: 'Disbursal Date',
  loan_amount: 'Loan Amount',
  emi_amount: 'EMI Amount',
  outstanding_principal: 'Outstanding Principal',
  outstanding_interest: 'Outstanding Interest',
  total_outstanding: 'Total Outstanding',
  last_payment_date: 'Last Payment Date',
  last_payment_amount: 'Last Payment Amount',
  next_emi_date: 'Next EMI Date',
  dpd: 'DPD',
  loan_status: 'Loan Status',
  bounce_case_id: 'Bounce Case ID',
  bounce_date: 'Bounce Date',
  bounce_reason: 'Bounce Reason',
  nach_status: 'NACH Status',
  bounce_cycle: 'Bounce Cycle',
  approval_log_id: 'Approval Log ID',
  from_status: 'From Status',
  to_status: 'To Status',
  action: 'Action',
  actor_id: 'Actor ID',
  actor_role: 'Actor Role',
  remarks: 'Remarks',
  performed_at: 'Performed At',
  ip_address: 'IP Address',
  strategy_step_id: 'Strategy Step ID',
  step_number: 'Step Number',
  step_name: 'Step Name',
  trigger_delay_value: 'Trigger Delay Value',
  channel: 'Channel',
  template_code: 'Template Code',
  retry_count: 'Retry Count',
  retry_delay_hours: 'Retry Delay Hours',
  payment_check_before_step: 'Payment Check Before Step',
  condition_expression: 'Condition Expression',
  escalation_trigger: 'Escalation Trigger',
  escalation_target: 'Escalation Target',
  strategy_execution_id: 'Strategy Execution ID',
  execution_id: 'Execution ID',
  case_type: 'Case Type',
  strategy_id: 'Strategy ID',
  strategy_name: 'Strategy Name',
  strategy_code: 'Strategy Code',
  strategy_version: 'Strategy Version',
  journey_type: 'Journey Type',
  dpd_range_from: 'DPD Range From',
  dpd_range_to: 'DPD Range To',
  bucket: 'Bucket',
  product_code: 'Product Code',
  state: 'State',
  customer_segment: 'Customer Segment',
  outstanding_range_min: 'Outstanding Range Min',
  outstanding_range_max: 'Outstanding Range Max',
  priority: 'Priority',
  effective_date: 'Effective Date',
  expiry_date: 'Expiry Date',
  status: 'Status',
  description: 'Description',
  created_by: 'Created By',
  created_at: 'Created At',
  updated_by: 'Updated By',
  updated_at: 'Updated At',
  is_active: 'Is Active',
  assigned_to: 'Assigned To',
  outstanding_total: 'Outstanding Total',
  branch: 'Branch',
  zone: 'Zone',
}

export const CASES_COLUMN_ORDER = [
  'strategy_id', 'strategy_name', 'strategy_code', 'strategy_version', 'journey_type',
  'dpd_range_from', 'dpd_range_to', 'bucket', 'product_code', 'state', 'customer_segment',
  'outstanding_range_min', 'outstanding_range_max', 'priority', 'effective_date', 'expiry_date',
  'status', 'description', 'created_by', 'created_at', 'updated_by', 'updated_at', 'is_active',
  'case_id', 'case_number', 'pr_number', 'loan_number', 'customer_id',
  'customer_name', 'mobile_number', 'alternate_mobile', 'email_id', 'product_name',
  'pre_emi_amount', 'pre_emi_date', 'mifin_batch_ref', 'mifin_extraction_date',
  'dpd_case_id', 'branch_name', 'disbursal_date', 'loan_amount', 'emi_amount',
  'outstanding_principal', 'outstanding_interest', 'total_outstanding', 'last_payment_date',
  'last_payment_amount', 'next_emi_date', 'dpd', 'loan_status', 'bounce_case_id', 'bounce_date',
  'bounce_reason', 'nach_status', 'bounce_cycle', 'approval_log_id', 'from_status', 'to_status',
  'action', 'actor_id', 'actor_role', 'remarks', 'performed_at', 'ip_address', 'strategy_step_id',
  'step_number', 'step_name', 'trigger_delay_value', 'channel', 'template_code', 'retry_count',
  'retry_delay_hours', 'payment_check_before_step', 'condition_expression', 'escalation_trigger',
  'escalation_target', 'execution_id', 'case_type', 'assigned_to', 'outstanding_total',
  'status', 'branch', 'zone',
]

export const COLORS = ['#000182', '#CE9B01', '#050058', '#D9EAF5', '#7c8ca6']

/**
 * Description of what this function does: Pretty formats table names (e.g. strategy-steps -> Strategy Steps).
 * Inputs: table: string
 * Outputs: string
 * Dependencies: none
 */
export const prettyTitle = (table: string): string =>
  table
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

/**
 * Description of what this function does: Dynamically picks a suitable column key for charts representing this table.
 * Inputs: table: string, columns: string[]
 * Outputs: string
 * Dependencies: none
 */
export const pickChartKey = (table: string, columns: string[]): string => {
  const preferred: Record<string, RegExp> = {
    cases: /bucket|status|journey|branch|zone|state/i,
    payments: /payment_mode|payment_source|payment_status/i,
    communication_logs: /channel|status|response_status/i,
    strategies: /strategy_name|status|bucket|journey_type/i,
    agents: /role|branch|zone|state|status/i,
    ptps: /honoured|agent_id/i,
  }

  const pattern =
    preferred[table] ??
    /status|mode|channel|role|branch|zone|state|bucket|journey|type|name|source|action|entity/i
  return columns.find((column) => pattern.test(column)) ?? columns[0] ?? ''
}

/**
 * Description of what this function does: Aggregates counts and builds general distribution chart data.
 * Inputs: rows: DcspTableRow[], table: string, columns: string[]
 * Outputs: Array<{ name: string; value: number; color: string }>
 * Dependencies: pickChartKey, safeToString
 */
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
  communication_logs: {
    primary: /channel/i,
    secondary: /status/i, // response_status is no longer used
    primaryTitle: 'Communications by Channel',
    secondaryTitle: 'Communications by Status',
  },
}

/**
 * Description of what this function does: Builds primary/secondary breakdown data based on column matching regex.
 * Inputs: rows: DcspTableRow[], columns: string[], pattern: RegExp
 * Outputs: Array<{ name: string; value: number; color: string }>
 * Dependencies: safeToString
 */
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
