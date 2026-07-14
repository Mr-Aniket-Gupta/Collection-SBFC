/*
This utility processes raw payment, strategy, and communication data to calculate business metrics for the top MIS dashboard cards. 
It removes duplicate records, performs calculations such as recovery amount, success rate, digital recovery percentage, and bounce rate, then returns formatted values for display.
*/

import type { DcspTableRow } from '../types'
import { formatCurrencyINR, formatPercent } from '../../../Components/formatters'
import { safeToString } from './tableUtils'
import type { MisTableRows } from './reportDataUtils'
export type { MisTableRows } from './reportDataUtils'
export { groupTableRowsFromBundle } from './reportDataUtils'

export interface MisCardMetric {
  value: string
  subtitle: string
}

/**
 * Description of what this function does: Normalizes value into an uppercase trimmed string.
 * Inputs: value: unknown
 * Outputs: string
 * Dependencies: safeToString
 */
const norm = (value: unknown): string => safeToString(value).trim().toUpperCase()

/**
 * Description of what this function does: Safe parses double/number from unknown value.
 * Inputs: value: unknown
 * Outputs: number
 * Dependencies: none
 */
const parseAmount = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Description of what this function does: Returns a list of rows deduplicated by a given primary ID key.
 * Inputs: rows: DcspTableRow[], idKey: string
 * Outputs: DcspTableRow[]
 * Dependencies: safeToString
 */
const uniqueRows = (rows: DcspTableRow[] = [], idKey: string): DcspTableRow[] => {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const id = safeToString(row[idKey] ?? row.strategy_id ?? row.case_id ?? row.id).trim()
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * Description of what this function does: Extracts a set of unique case IDs.
 * Inputs: rows: DcspTableRow[]
 * Outputs: Set<string>
 * Dependencies: safeToString
 */
const uniqueCaseIds = (rows: DcspTableRow[]): Set<string> => {
  const ids = new Set<string>()
  rows.forEach((row) => {
    const caseId = safeToString(row.strategy_id || row.case_id).trim()
    if (caseId) ids.add(caseId)
  })
  return ids
}

/**
 * Description of what this function does: Calculates percentage of a part over a total.
 * Inputs: part: number, total: number
 * Outputs: number
 * Dependencies: none
 */
const percentOf = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0)

/**
 * Description of what this function does: Builds display metrics for the top MIS category cards.
 * Inputs: cardTitles: Record<string, string>, rows: MisTableRows
 * Outputs: Map<string, MisCardMetric>
 * Dependencies: uniqueRows, parseAmount, formatCurrencyINR, uniqueCaseIds, formatPercent, percentOf, norm
 */
export function buildMisCardMetrics(
  cardTitles: Record<string, string>,
  rows: MisTableRows,
): Map<string, MisCardMetric> {
  const payments = uniqueRows(rows.payments, 'payment_id')
  const strategies = uniqueRows(rows.strategies, 'strategy_id')
  const communications = uniqueRows(rows.communications, 'communication_id')
  const dpdCases = uniqueRows(rows.dpdCases, 'dpd_case_id')
  const bounceCases = uniqueRows(rows.bounceCases, 'bounce_case_id')

  const metrics = new Map<string, MisCardMetric>()

  const paymentModeCounts = payments.reduce<Map<string, number>>((acc, row) => {
    const mode = norm(row.payment_mode) || 'UNKNOWN'
    acc.set(mode, (acc.get(mode) ?? 0) + 1)
    return acc
  }, new Map())

  const successPayments = payments.filter((row) => norm(row.payment_status) === 'SUCCESS')

  const recoveryAmount = successPayments.reduce(
    (sum, row) => sum + parseAmount(row.payment_amount ?? row.amount),
    0,
  )
  if (cardTitles.recovery) {
    metrics.set(cardTitles.recovery, {
      value: formatCurrencyINR(recoveryAmount),
      subtitle: 'Total successful payment amount',
    })
  }

  if (cardTitles.payment) {
    const summary = Array.from(paymentModeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mode, count]) => `${mode}: ${count}`)
      .join(' • ')

    metrics.set(cardTitles.payment, {
      value: payments.length > 0 ? payments.length.toLocaleString('en-IN') : '0',
      subtitle: summary || 'No payment modes found',
    })
  }

  const npaCount = dpdCases.filter((row) => norm(row.bucket) === 'NPA').length
  if (cardTitles.bucket) {
    metrics.set(cardTitles.bucket, {
      value: npaCount.toLocaleString('en-IN'),
      subtitle: 'NPA cases',
    })
  }

  const digitalPayments = payments.filter(
    (row) => norm(row.payment_mode) !== 'CASH',
  )
  if (cardTitles.digital) {
    metrics.set(cardTitles.digital, {
      value: payments.length > 0 ? formatPercent(percentOf(digitalPayments.length, payments.length)) : '0.0%',
      subtitle: `${digitalPayments.length.toLocaleString('en-IN')} of ${payments.length.toLocaleString('en-IN')} payments`,
    })
  }

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

  const dpdTotal = dpdCases.length
  metrics.set('DPD Cases', {
    value: dpdTotal.toLocaleString('en-IN'),
    subtitle: 'Total DPD cases',
  })

  const bounceCount = bounceCases.length
  const totalCases = dpdCases.length + bounceCases.length
  const bounceTitle = cardTitles.bounce || 'Bounce Analysis'
  metrics.set(bounceTitle, {
    value: totalCases > 0 ? formatPercent(percentOf(bounceCount, totalCases)) : '0.0%',
    subtitle: `${bounceCount.toLocaleString('en-IN')} bounce cases`,
  })

  return metrics
}
