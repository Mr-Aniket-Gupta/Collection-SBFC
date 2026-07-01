import type { ReportTableKey } from '../hooks/useReports'
import type { DcspTableRow } from '../types'
import { isWithinDateRange, type DateRangeOption } from './dateFilter'
import {
  isCommunicationRow,
  isPaymentRow,
} from './rowDetectors'
import { safeToString } from './tableUtils'

const norm = (value: unknown): string => safeToString(value).trim().toUpperCase()
const id = (value: unknown): string => safeToString(value).trim()

export interface ReportTableBundle {
  cases: DcspTableRow[]
  payments: DcspTableRow[]
  communications: DcspTableRow[]
  strategies: DcspTableRow[]
  agents: DcspTableRow[]
  allocations: DcspTableRow[]
  ptps: DcspTableRow[]
  'audit-logs': DcspTableRow[]
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
  'cases',
  'payments',
  'communications',
  'strategies',
  'agents',
  'allocations',
  'ptps',
  'audit-logs',
]

export const EMPTY_BUNDLE = (): ReportTableBundle => ({
  cases: [],
  payments: [],
  communications: [],
  strategies: [],
  agents: [],
  allocations: [],
  ptps: [],
  'audit-logs': [],
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
    primaryTable: 'strategies',
    primaryPredicate: (row) => norm(row.bucket) === 'NPA' && norm(row.status) === 'ACTIVE',
  },
  'Digital Recovery': {
    primaryTable: 'payments',
    primaryPredicate: (row) => isPaymentRow(row) && norm(row.payment_mode) !== 'CASH',
  },
  'Payment MIS': {
    primaryTable: 'payments',
    primaryPredicate: (row) => isPaymentRow(row) && norm(row.payment_status) === 'SUCCESS',
  },
  'Strategy Reports': {
    primaryTable: 'strategies',
    primaryPredicate: (row) => norm(row.status) === 'ACTIVE',
  },
  'Communication Reports': {
    primaryTable: 'communications',
    primaryPredicate: (row) => isCommunicationRow(row) && norm(row.status) === 'DELIVERED',
  },
  'Bounce Analysis': {
    primaryTable: 'payments',
    primaryPredicate: (row) => isPaymentRow(row) && norm(row.payment_status) === 'FAILED',
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
  switch (tableKey) {
    case 'payments':
      addId(row.case_id, ids.caseIds)
      addId(row.loan_number, ids.loanNumbers)
      break
    case 'communications':
      addId(row.case_id, ids.caseIds)
      break
    case 'strategies':
      addId(row.strategy_id, ids.strategyIds)
      break
    case 'cases':
      addId(row.case_id, ids.caseIds)
      addId(row.customer_id, ids.customerIds)
      addId(row.loan_number, ids.loanNumbers)
      addId(row.strategy_id, ids.strategyIds)
      addId(row.assigned_to, ids.agentIds)
      break
    default:
      addId(row.case_id, ids.caseIds)
      break
  }
}

const enrichIdsFromCasesHub = (ids: GlobalFilterIds, cases: DcspTableRow[]): boolean => {
  let changed = false

  cases.forEach((row) => {
    const caseId = id(row.case_id)
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
  bundle.allocations.forEach((row) => {
    const caseId = id(row.case_id)
    if (caseId && ids.caseIds.has(caseId)) addId(row.allocated_to, ids.agentIds)
  })
  bundle.ptps.forEach((row) => {
    const caseId = id(row.case_id)
    if (caseId && ids.caseIds.has(caseId)) addId(row.agent_id, ids.agentIds)
  })
}

/** Step 1–2: primary-table predicate → extract & expand Case / Customer / Loan / Strategy IDs. */
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
    const changed = enrichIdsFromCasesHub(ids, bundle.cases)
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
  const caseId = id(row.case_id)
  const customerId = id(row.customer_id)
  const loanNumber = id(row.loan_number)
  const strategyId = id(row.strategy_id)
  const agentId = id(row.agent_id ?? row.assigned_to ?? row.allocated_to)

  switch (tableKey) {
    case 'cases':
      return (
        (caseId !== '' && ids.caseIds.has(caseId)) ||
        (customerId !== '' && ids.customerIds.has(customerId)) ||
        (loanNumber !== '' && ids.loanNumbers.has(loanNumber)) ||
        (strategyId !== '' && ids.strategyIds.has(strategyId))
      )
    case 'payments':
    case 'communications':
    case 'ptps':
    case 'allocations':
      return (
        (caseId !== '' && ids.caseIds.has(caseId)) ||
        (loanNumber !== '' && ids.loanNumbers.has(loanNumber))
      )
    case 'strategies':
      return strategyId !== '' && ids.strategyIds.has(strategyId)
    case 'agents':
      return agentId !== '' && ids.agentIds.has(agentId)
    case 'audit-logs': {
      const entityId = id(row.entity_id)
      const entityType = norm(row.entity_type)
      if (!entityId) return false
      if (entityType.includes('CASE') && ids.caseIds.has(entityId)) return true
      if (entityType.includes('STRATEGY') && ids.strategyIds.has(entityId)) return true
      if (entityType.includes('AGENT') && ids.agentIds.has(entityId)) return true
      return (
        ids.caseIds.has(entityId) ||
        ids.strategyIds.has(entityId) ||
        ids.agentIds.has(entityId) ||
        ids.customerIds.has(entityId)
      )
    }
    default:
      return false
  }
}

/** Step 3: propagate resolved IDs across every related table. */
export function applyGlobalFilterIds(
  bundle: ReportTableBundle,
  ids: GlobalFilterIds,
): ReportTableBundle {
  if (idsAreEmpty(ids)) return EMPTY_BUNDLE()

  const filtered = EMPTY_BUNDLE()
  REPORT_TABLE_KEYS.forEach((tableKey) => {
    filtered[tableKey] = bundle[tableKey].filter((row) => rowMatchesIds(row, tableKey, ids))
  })
  return filtered
}

export function applyCategoryGlobalFilter(
  bundle: ReportTableBundle,
  categoryTitle: string,
): { bundle: ReportTableBundle; context: GlobalFilterContext | null } {
  if (!categoryTitle) return { bundle, context: null }

  const context = buildGlobalFilterContext(categoryTitle, bundle)
  if (!context || context.primaryMatchCount === 0) {
    return { bundle: EMPTY_BUNDLE(), context }
  }

  return {
    bundle: applyGlobalFilterIds(bundle, context.ids),
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
    filtered[tableKey] = bundle[tableKey].filter((row) =>
      isWithinDateRange(row, dateRange, customFromDate, customToDate),
    )
  })
  return filtered
}

/** Collects distinct branch values from the cases table. */
export function extractBranchOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>()
  bundle.cases.forEach((row) => {
    const branch = safeToString(row.branch).trim()
    if (branch) values.add(branch)
  })
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

/** Collects distinct zone values from the cases table. */
export function extractZoneOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>()
  bundle.cases.forEach((row) => {
    const zone = safeToString(row.zone).trim()
    if (zone) values.add(zone)
  })
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

/** Collects distinct state values from the cases table. */
export function extractStateOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>()
  bundle.cases.forEach((row) => {
    const state = safeToString(row.state).trim()
    if (state) values.add(state)
  })
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

/** Filters bundle rows using branch/zone/state from the cases table; other tables match via case_id. */
export function filterBundleByBranchZone(
  bundle: ReportTableBundle,
  branchFilter: string,
  zoneFilter: string,
  stateFilter: string,
): ReportTableBundle {
  if (!branchFilter && !zoneFilter && !stateFilter) return bundle

  const matchingCaseIds = new Set<string>()
  const filteredCases = bundle.cases.filter((row) => {
    if (branchFilter && norm(row.branch) !== norm(branchFilter)) return false
    if (zoneFilter && norm(row.zone) !== norm(zoneFilter)) return false
    if (stateFilter && norm(row.state) !== norm(stateFilter)) return false
    const caseId = id(row.case_id)
    if (caseId) matchingCaseIds.add(caseId)
    return true
  })

  const filtered = EMPTY_BUNDLE()
  filtered.cases = filteredCases

  REPORT_TABLE_KEYS.forEach((tableKey) => {
    if (tableKey === 'cases') return
    filtered[tableKey] = bundle[tableKey].filter((row) => {
      const caseId = id(row.case_id)
      return caseId !== '' && matchingCaseIds.has(caseId)
    })
  })

  return filtered
}

export function countBundleRows(bundle: ReportTableBundle): number {
  return REPORT_TABLE_KEYS.reduce((sum, key) => sum + bundle[key].length, 0)
}
