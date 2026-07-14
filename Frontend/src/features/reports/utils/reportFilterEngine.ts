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
    primaryPredicate: (row) => Number(row.dpd ?? 0) >= 0,
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
      break
    default:
      addId(row.strategy_id, ids.strategyIds)
      addId(row.case_id, ids.caseIds)
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
  const caseId = id(row.case_id)
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

export function extractBranchOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>()
  if (bundle.branches && bundle.branches.length > 0) {
    bundle.branches.forEach((row) => {
      const branch = getBranchName(row)
      if (branch) values.add(branch)
    })
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

export function extractZoneOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>()
  if (bundle.branches && bundle.branches.length > 0) {
    bundle.branches.forEach((row) => {
      const zone = safeToString(row.zone_code || row.zone).trim()
      if (zone) values.add(zone)
    })
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

export function extractStateOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>()
  if (bundle.branches && bundle.branches.length > 0) {
    bundle.branches.forEach((row) => {
      const state = safeToString(row.state || row.region_code).trim()
      if (state) values.add(state)
    })
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

export function filterBundleByBranchZone(
  bundle: ReportTableBundle,
  branchFilter: string,
  zoneFilter: string,
  stateFilter: string,
): ReportTableBundle {
  const cacheForBundle = bundleFilterCache.get(bundle)
  const key = JSON.stringify({ b: branchFilter || '', z: zoneFilter || '', s: stateFilter || '' })
  if (cacheForBundle?.has(key)) return cacheForBundle.get(key) as ReportTableBundle

  const index = getBundleIndex(bundle)

  if (!branchFilter && !zoneFilter && !stateFilter) {
    setCache(bundle, key, bundle)
    return bundle
  }

  const intersect = (a: Set<string> | null, b: Set<string>): Set<string> => {
    if (a === null) return new Set(b)
    const out = new Set<string>()
    b.forEach((v) => { if (a.has(v)) out.add(v) })
    return out
  }

  let caseSet: Set<string> | null = null
  let strategySet: Set<string> | null = null

  if (branchFilter) {
    const entry = index.branches.get(norm(branchFilter))
    if (!entry) { setCache(bundle, key, EMPTY_BUNDLE()); return EMPTY_BUNDLE() }
    caseSet = intersect(caseSet, entry.caseIds)
    strategySet = intersect(strategySet, entry.strategyIds)
  }

  if (zoneFilter) {
    const entry = index.zones.get(norm(zoneFilter))
    if (!entry) { setCache(bundle, key, EMPTY_BUNDLE()); return EMPTY_BUNDLE() }
    caseSet = intersect(caseSet, entry.caseIds)
    strategySet = intersect(strategySet, entry.strategyIds)
  }

  if (stateFilter) {
    const entry = index.states.get(norm(stateFilter))
    if (!entry) { setCache(bundle, key, EMPTY_BUNDLE()); return EMPTY_BUNDLE() }
    caseSet = intersect(caseSet, entry.caseIds)
    strategySet = intersect(strategySet, entry.strategyIds)
  }

  const finalCaseIds = caseSet ?? new Set<string>()
  const finalStrategyIds = strategySet ?? new Set<string>()
  if (finalCaseIds.size === 0 && finalStrategyIds.size === 0) {
    setCache(bundle, key, EMPTY_BUNDLE())
    return EMPTY_BUNDLE()
  }

  const filtered = EMPTY_BUNDLE()

  REPORT_TABLE_KEYS.forEach((tableKey) => {
    if (tableKey === 'branches') {
      filtered.branches = bundle.branches.filter((row) => {
        const name = getBranchName(row)
        if (branchFilter && norm(name) !== norm(branchFilter)) return false
        if (zoneFilter && norm(row.zone_code || row.zone) !== norm(zoneFilter)) return false
        if (stateFilter && norm(row.state || row.region_code) !== norm(stateFilter)) return false
        return true
      })
      return
    }

    filtered[tableKey] = bundle[tableKey].filter((row) => {
      const caseId = id(row.case_id)
      const strategyId = id(row.strategy_id)
      const matchCase = caseId !== '' && finalCaseIds.has(caseId)
      const matchStrategy = strategyId !== '' && finalStrategyIds.has(strategyId)
      return matchCase || matchStrategy
    })
  })

  setCache(bundle, key, filtered)
  return filtered
}

const bundleFilterCache = new WeakMap<ReportTableBundle, Map<string, ReportTableBundle>>()

function setCache(bundle: ReportTableBundle, key: string, value: ReportTableBundle) {
  let m = bundleFilterCache.get(bundle)
  if (!m) {
    m = new Map<string, ReportTableBundle>()
    bundleFilterCache.set(bundle, m)
  }
  m.set(key, value)
}

type IdSet = { caseIds: Set<string>, strategyIds: Set<string> }
const bundleIndexCache = new WeakMap<ReportTableBundle, {
  branches: Map<string, IdSet>
  zones: Map<string, IdSet>
  states: Map<string, IdSet>
}>()

function getBundleIndex(bundle: ReportTableBundle) {
  let idx = bundleIndexCache.get(bundle)
  if (idx) return idx

  const branches = new Map<string, IdSet>()
  const zones = new Map<string, IdSet>()
  const states = new Map<string, IdSet>()

  bundle['dpd-cases'].forEach((row) => {
    const branchVal = norm(getBranchName(row) || row.branch_name || '')
    const zoneVal = norm(row.zone_code || row.zone || '')
    const stateVal = norm(row.state || '')
    const caseId = id(row.case_id) || id(row.dpd_case_id) || ''
    const strategyId = id(row.strategy_id) || ''

    const addTo = (map: Map<string, IdSet>, key: string) => {
      if (!key) return
      let e = map.get(key)
      if (!e) { e = { caseIds: new Set<string>(), strategyIds: new Set<string>() }; map.set(key, e) }
      if (caseId) e.caseIds.add(caseId)
      if (strategyId) e.strategyIds.add(strategyId)
    }

    addTo(branches, branchVal)
    addTo(zones, zoneVal)
    addTo(states, stateVal)
  })

  idx = { branches, zones, states }
  bundleIndexCache.set(bundle, idx)
  return idx
}

export function countBundleRows(bundle: ReportTableBundle): number {
  return REPORT_TABLE_KEYS.reduce((sum, key) => sum + bundle[key].length, 0)
}
