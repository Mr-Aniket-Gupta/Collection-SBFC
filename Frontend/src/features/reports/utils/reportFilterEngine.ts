// This utility acts as the central filtering engine for the Reports module. It applies category, date, branch, zone, and state filters, propagates matching IDs across related tables, and returns a synchronized dataset for charts, tables, and dashboard cards.

import type { ReportTableKey } from '../hooks/useReports'
import type { DcspTableRow } from '../types'
import { isWithinDateRange } from '../../../Components/dateFilter'
import type { DateRangeOption } from '../types'
import {
  isCommunicationLogsRow,
  isPaymentRow,
} from './rowDetectors'
import { safeToString, getBranchName } from './tableUtils'

const norm = (value: unknown): string => safeToString(value).toString().trim().replace(/\s+/g, ' ').toUpperCase()
const id = (value: unknown): string => safeToString(value).trim()

export interface ReportTableBundle {
  strategies: DcspTableRow[]
  'strategy-execution-log': DcspTableRow[]
  'dpd-cases': DcspTableRow[]
  'bounce-cases': DcspTableRow[]
  payments: DcspTableRow[]
  communication_logs: DcspTableRow[]
  ptps: DcspTableRow[]
  branches: DcspTableRow[]
  agents: DcspTableRow[]
}

export interface GlobalFilterIds {
  caseIds: Set<string>
  customerIds: Set<string>
  loanNumbers: Set<string>
  strategyIds: Set<string>
  agentIds: Set<string>
}

export interface CategoryFilterConfig {
  primaryTable: ReportTableKey
  primaryPredicate: (row: DcspTableRow) => boolean
}

export interface GlobalFilterContext {
  categoryTitle: string
  primaryTable: ReportTableKey
  primaryMatchCount: number
  ids: GlobalFilterIds
}

export const REPORT_TABLE_KEYS: ReportTableKey[] = [
  'strategies',
  'strategy-execution-log',
  'dpd-cases',
  'bounce-cases',
  // 'cases',
  'payments',
  'communication_logs',
  'ptps',
  'branches',
  'agents',
]

export const EMPTY_BUNDLE = (): ReportTableBundle => ({
  strategies: [],
  'strategy-execution-log': [],
  'dpd-cases': [],
  'bounce-cases': [],
  payments: [],
  communication_logs: [],
  ptps: [],
  branches: [],
  agents: [],
})

const emptyIds = (): GlobalFilterIds => ({
  caseIds: new Set(),
  customerIds: new Set(),
  loanNumbers: new Set(),
  strategyIds: new Set(),
  agentIds: new Set(),
})

/** Category → primary table + row predicate (step 1 of global filter). */
export const CATEGORY_FILTER_CONFIG: Record<string, CategoryFilterConfig> = {
  'Recovery MIS': {
    primaryTable: 'payments',
    primaryPredicate: (row) => isPaymentRow(row) && norm(row.payment_status) === 'SUCCESS',
  },
  'Bucket-wise MIS': {
    primaryTable: 'dpd-cases',
    primaryPredicate: (row) => norm(row.bucket) === 'NPA',
  },
  'Digital Recovery': {
    primaryTable: 'payments',
    primaryPredicate: (row) => isPaymentRow(row) && norm(row.payment_mode) !== 'CASH',
  },
  'Payment MIS': {
    primaryTable: 'payments',
    primaryPredicate: (row) => isPaymentRow(row),
  },

  'Strategy Reports': {
    primaryTable: 'strategies',
    primaryPredicate: (row) => norm(row.status) === 'ACTIVE',
  },
  'DPD Cases': {
    primaryTable: 'dpd-cases',
    primaryPredicate: (row) => row.dpd_case_id != null
  },
  'Bounce Cases': {
    primaryTable: 'bounce-cases',
    primaryPredicate: (row) => norm(row.status) === 'PENDING_STRATEGY' || norm(row.status) === 'PENDING',
  },
  'Communication Reports': {
    primaryTable: 'communication_logs',
    primaryPredicate: (row) => isCommunicationLogsRow(row) && norm(row.status) === 'DELIVERED',
  },
  'Bounce Analysis': {
    primaryTable: 'bounce-cases',
    primaryPredicate: () => true,
  },
}

const addId = (value: unknown, set: Set<string>) => {
  const next = id(value)
  if (!next) return false
  if (set.has(next)) return false
  set.add(next)
  return true
}

const seedIdsFromPrimaryRow = (row: DcspTableRow, tableKey: ReportTableKey, ids: GlobalFilterIds) => {
  const getCaseId = (r: any) => id(r.dpd_case_id ?? r.pre_emi_case_id ?? r.bounce_case_id ?? r.case_id)
  switch (tableKey) {
    case 'payments':
      addId(row.strategy_id, ids.strategyIds)
      addId(row.loan_number, ids.loanNumbers)
      break
    case 'communication_logs':
      addId(row.strategy_id, ids.strategyIds)
      break
    case 'ptps':
      addId(row.strategy_id, ids.strategyIds)
      break
    case 'strategies':
      addId(row.strategy_id, ids.strategyIds)
      break
    case 'dpd-cases':
    case 'bounce-cases':
      addId(row.strategy_id, ids.strategyIds)
      addId(getCaseId(row), ids.caseIds)
      break
    default:
      addId(row.strategy_id, ids.strategyIds)
      addId(getCaseId(row), ids.caseIds)
      break
  }
}

const enrichIdsFromCasesHub = (ids: GlobalFilterIds, cases: DcspTableRow[]): boolean => {
  let changed = false

  cases.forEach((row) => {
    const caseId = id(row.dpd_case_id ?? row.pre_emi_case_id ?? row.bounce_case_id ?? row.case_id)
    const customerId = id(row.customer_id)
    const loanNumber = id(row.loan_number)
    const strategyId = id(row.strategy_id)

    const linked =
      (caseId && ids.caseIds.has(caseId)) ||
      (customerId && ids.customerIds.has(customerId)) ||
      (loanNumber && ids.loanNumbers.has(loanNumber)) ||
      (strategyId && ids.strategyIds.has(strategyId))

    if (!linked) return

    if (caseId && addId(caseId, ids.caseIds)) changed = true
    if (addId(row.customer_id, ids.customerIds)) changed = true
    if (addId(row.loan_number, ids.loanNumbers)) changed = true
    if (addId(row.strategy_id, ids.strategyIds)) changed = true
    if (addId(row.assigned_to, ids.agentIds)) changed = true
  })

  return changed
}

const enrichAgentIds = (ids: GlobalFilterIds, bundle: ReportTableBundle) => {

  bundle.ptps.forEach((row) => {
    const caseId = id(row.dpd_case_id ?? row.pre_emi_case_id ?? row.bounce_case_id ?? row.case_id)
    const strategyId = id(row.strategy_id)
    if ((caseId && ids.caseIds.has(caseId)) || (strategyId && ids.strategyIds.has(strategyId))) {
      addId(row.agent_id, ids.agentIds)
    }
  })
}

export function resolveGlobalFilterIds(
  categoryTitle: string,
  bundle: ReportTableBundle,
): GlobalFilterIds | null {
  const config = CATEGORY_FILTER_CONFIG[categoryTitle]
  if (!config) return null

  const primaryRows = bundle[config.primaryTable].filter(config.primaryPredicate)
  const ids = emptyIds()

  primaryRows.forEach((row) => seedIdsFromPrimaryRow(row, config.primaryTable, ids))

  for (let pass = 0; pass < 4; pass += 1) {
    const changed = enrichIdsFromCasesHub(ids, bundle['dpd-cases'])
    if (!changed) break
  }

  enrichAgentIds(ids, bundle)
  return ids
}

export function buildGlobalFilterContext(
  categoryTitle: string,
  bundle: ReportTableBundle,
): GlobalFilterContext | null {
  if (!categoryTitle) return null
  const config = CATEGORY_FILTER_CONFIG[categoryTitle]
  if (!config) return null

  const primaryMatchCount = bundle[config.primaryTable].filter(config.primaryPredicate).length
  const ids = resolveGlobalFilterIds(categoryTitle, bundle) ?? emptyIds()

  return {
    categoryTitle,
    primaryTable: config.primaryTable,
    primaryMatchCount,
    ids,
  }
}

const idsAreEmpty = (ids: GlobalFilterIds): boolean =>
  ids.caseIds.size === 0 &&
  ids.customerIds.size === 0 &&
  ids.loanNumbers.size === 0 &&
  ids.strategyIds.size === 0 &&
  ids.agentIds.size === 0


const rowMatchesIds = (row: DcspTableRow, tableKey: ReportTableKey, ids: GlobalFilterIds): boolean => {
  const caseId = id(row.dpd_case_id ?? row.pre_emi_case_id ?? row.bounce_case_id ?? row.case_id)
  const loanNumber = id(row.loan_number)
  const strategyId = id(row.strategy_id)
  // const agentId = id(row.agent_id ?? row.assigned_to ?? row.allocated_to)

  switch (tableKey) {
    case 'payments':
    case 'communication_logs':
    case 'ptps':
    case 'dpd-cases':
    case 'bounce-cases':
      return (
        (caseId !== '' && ids.caseIds.has(caseId)) ||
        (strategyId !== '' && ids.strategyIds.has(strategyId)) ||
        (loanNumber !== '' && ids.loanNumbers.has(loanNumber))
      )
    case 'strategies':
      return strategyId !== '' && ids.strategyIds.has(strategyId)
    default:
      return false
  }
}

export function applyGlobalFilterIds(
  bundle: ReportTableBundle,
  ids: GlobalFilterIds,
): ReportTableBundle {
  if (idsAreEmpty(ids)) return EMPTY_BUNDLE()

  const filtered = EMPTY_BUNDLE()
  REPORT_TABLE_KEYS.forEach((tableKey) => {
    if (tableKey === 'branches') {
      filtered[tableKey] = bundle[tableKey]
    } else {
      filtered[tableKey] = bundle[tableKey].filter((row) => rowMatchesIds(row, tableKey, ids))
    }
  })
  return filtered
}

export function applyCategoryGlobalFilter(
  bundle: ReportTableBundle,
  categoryTitle: string,
): { bundle: ReportTableBundle; context: GlobalFilterContext | null } {
  if (!categoryTitle) return { bundle, context: null }

  const config = CATEGORY_FILTER_CONFIG[categoryTitle]
  if (!config) return { bundle, context: null }

  const context = buildGlobalFilterContext(categoryTitle, bundle)
  if (!context || context.primaryMatchCount === 0) {
    return { bundle: EMPTY_BUNDLE(), context }
  }

  const filtered = applyGlobalFilterIds(bundle, context.ids)

  filtered[config.primaryTable] =
    bundle[config.primaryTable].filter(config.primaryPredicate)

  return {
    bundle: filtered,
    context,
  }
}

export function filterBundleByDateRange(
  bundle: ReportTableBundle,
  dateRange: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): ReportTableBundle {
  const filtered = EMPTY_BUNDLE()
  REPORT_TABLE_KEYS.forEach((tableKey) => {
    if (tableKey === 'branches') {
      filtered[tableKey] = bundle[tableKey]
      return
    }

    filtered[tableKey] = bundle[tableKey].filter((row) =>
      isWithinDateRange(row, dateRange, customFromDate, customToDate),
    )
  })
  return filtered
}

export { extractBranchOptions, extractZoneOptions, extractStateOptions, filterBundleByBranchZone } from '../../../Components/Filters/filterUtils'

export function countBundleRows(bundle: ReportTableBundle): number {
  return REPORT_TABLE_KEYS.reduce((sum, key) => sum + bundle[key].length, 0)
}
