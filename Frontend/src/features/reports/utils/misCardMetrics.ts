/*
This utility processes raw payment, strategy, and communication data to calculate business metrics for the top MIS dashboard cards. 
It removes duplicate records, performs calculations such as recovery amount, success rate, digital recovery percentage, and bounce rate, then returns formatted values for display.
*/

import type { DcspTableRow } from '../types'
import { formatCurrencyINR, formatPercent } from './formatters'
import { safeToString } from './tableUtils'
import type { MisTableRows } from './reportDataUtils'
export type { MisTableRows } from './reportDataUtils'
export { groupTableRowsFromBundle } from './reportDataUtils'

export interface MisCardMetric {
  value: string
  subtitle: string
}

const norm = (value: unknown): string => safeToString(value).trim().toUpperCase()

const parseAmount = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const uniqueRows = (rows: DcspTableRow[], idKey: string): DcspTableRow[] => {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const id = safeToString(row[idKey] ?? row.case_id ?? row.id).trim()
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const uniqueCaseIds = (rows: DcspTableRow[]): Set<string> => {
  const ids = new Set<string>()
  rows.forEach((row) => {
    const caseId = safeToString(row.case_id).trim()
    if (caseId) ids.add(caseId)
  })
  return ids
}

const percentOf = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0)

const MIS_TABLE_KEYS = ['payments', 'strategies', 'communications', 'pre-emi-cases', 'dpd-cases', 'bounce-cases'] as const
type MisTableKey = (typeof MIS_TABLE_KEYS)[number]

interface LegacyMisTableRows {
  payments: DcspTableRow[]
  strategies: DcspTableRow[]
  communications: DcspTableRow[]
  preEmiCases: DcspTableRow[]
  dpdCases: DcspTableRow[]
  bounceCases: DcspTableRow[]
}

/** Builds display metrics for the 7 top MIS category cards. */
export function buildMisCardMetrics(
  cardTitles: Record<string, string>,
  rows: MisTableRows,
): Map<string, MisCardMetric> {
  const payments = uniqueRows(rows.payments, 'payment_id')
  const strategies = uniqueRows(rows.strategies, 'strategy_id')
  const communications = uniqueRows(rows.communications, 'communication_id')
  const preEmiCases = uniqueRows(rows.preEmiCases, 'pre_emi_case_id')
  const dpdCases = uniqueRows(rows.dpdCases, 'dpd_case_id')
  const bounceCases = uniqueRows(rows.bounceCases, 'bounce_case_id')

  const metrics = new Map<string, MisCardMetric>()

  const recoveryAmount = payments.reduce(
    (sum, row) => sum + parseAmount(row.payment_amount ?? row.amount),
    0,
  )
  metrics.set(cardTitles.recovery, {
    value: formatCurrencyINR(recoveryAmount),
    subtitle: 'Total payment amount',
  })

  const successPayments = payments.filter((row) => norm(row.payment_status) === 'SUCCESS')

  const activeNpaCount = strategies.filter(
    (row) => norm(row.bucket) === 'NPA' && norm(row.status) === 'ACTIVE',
  ).length
  metrics.set(cardTitles.bucket, {
    value: activeNpaCount.toLocaleString('en-IN'),
    subtitle: 'Active NPA strategies',
  })

  const totalPaymentUsers = uniqueCaseIds(payments).size
  const digitalSuccessUsers = uniqueCaseIds(
    payments.filter(
      (row) => norm(row.payment_status) === 'SUCCESS' && norm(row.payment_mode) !== 'CASH',
    ),
  ).size
  metrics.set(cardTitles.digital, {
    value: totalPaymentUsers > 0 ? formatPercent(percentOf(digitalSuccessUsers, totalPaymentUsers)) : '0.0%',
    subtitle: `${digitalSuccessUsers.toLocaleString('en-IN')} of ${totalPaymentUsers.toLocaleString('en-IN')} users`,
  })

  const paymentSuccessRate = percentOf(successPayments.length, payments.length)
  metrics.set(cardTitles.payment, {
    value: payments.length > 0 ? formatPercent(paymentSuccessRate) : '0.0%',
    subtitle: `${successPayments.length.toLocaleString('en-IN')} successful payments`,
  })

  const activeStrategies = strategies.filter((row) => norm(row.status) === 'ACTIVE').length
  metrics.set(cardTitles.strategy, {
    value: strategies.length > 0 ? formatPercent(percentOf(activeStrategies, strategies.length)) : '0.0%',
    subtitle: `${activeStrategies.toLocaleString('en-IN')} active strategies`,
  })

  const deliveredCount = communications.filter((row) => norm(row.status) === 'DELIVERED').length
  metrics.set(cardTitles.comm, {
    value: communications.length > 0 ? formatPercent(percentOf(deliveredCount, communications.length)) : '0.0%',
    subtitle: `${deliveredCount.toLocaleString('en-IN')} delivered messages`,
  })

  const failedPayments = payments.filter((row) => norm(row.payment_status) === 'FAILED').length
  metrics.set(cardTitles.bounce, {
    value: payments.length > 0 ? formatPercent(percentOf(failedPayments, payments.length)) : '0.0%',
    subtitle: `${failedPayments.toLocaleString('en-IN')} failed payments`,
  })

  const preEmiPending = preEmiCases.filter((row) => norm(row.status) === 'PENDING_STRATEGY').length
  metrics.set('Pre EMI Cases', {
    value: preEmiCases.length > 0 ? formatPercent(percentOf(preEmiPending, preEmiCases.length)) : '0.0%',
    subtitle: `${preEmiPending.toLocaleString('en-IN')} pending strategies`,
  })

  const dpdHighRisk = dpdCases.filter((row) => Number(row.dpd ?? 0) >= 90).length
  metrics.set('DPD Cases', {
    value: dpdCases.length > 0 ? formatPercent(percentOf(dpdHighRisk, dpdCases.length)) : '0.0%',
    subtitle: `${dpdHighRisk.toLocaleString('en-IN')} high risk cases`,
  })

  const bounceCount = bounceCases.length
  metrics.set('Bounce Analysis', {
    value: bounceCases.length > 0 ? formatPercent(percentOf(bounceCount, bounceCases.length)) : '0.0%',
    subtitle: `${bounceCount.toLocaleString('en-IN')} bounce cases`,
  })

  return metrics
}

/** @deprecated Use groupTableRowsFromBundle with ReportTableBundle instead. */
export function groupUniqueTableRows(
  reports: Array<{ category: string; source: DcspTableRow }>,
  categoryTableMap: Map<string, string>,
): LegacyMisTableRows {
  const grouped: LegacyMisTableRows = { payments: [], strategies: [], communications: [], preEmiCases: [], dpdCases: [], bounceCases: [] }
  const seenByTable: Record<MisTableKey, Set<string>> = {
    payments: new Set(),
    strategies: new Set(),
    communications: new Set(),
    'pre-emi-cases': new Set(),
    'dpd-cases': new Set(),
    'bounce-cases': new Set(),
  }
  const idKeys: Record<MisTableKey, string> = {
    payments: 'payment_id',
    strategies: 'strategy_id',
    communications: 'communication_id',
    'pre-emi-cases': 'pre_emi_case_id',
    'dpd-cases': 'dpd_case_id',
    'bounce-cases': 'bounce_case_id',
  }

  reports.forEach((report) => {
    const tableKey = categoryTableMap.get(report.category)
    if (!tableKey || !MIS_TABLE_KEYS.includes(tableKey as MisTableKey)) return
    const table = tableKey as MisTableKey

    const id = safeToString(report.source[idKeys[table]] ?? report.source.case_id ?? report.source.id).trim()
    if (!id || seenByTable[table].has(id)) return

    seenByTable[table].add(id)
    if (table === 'pre-emi-cases') grouped.preEmiCases.push(report.source)
    else if (table === 'dpd-cases') grouped.dpdCases.push(report.source)
    else if (table === 'bounce-cases') grouped.bounceCases.push(report.source)
    else grouped[table].push(report.source)
  })

  return grouped
}
