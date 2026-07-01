import type { DateRangeOption, DcspTableRow } from '../types'
import { extractRowDate, getDateRangeBounds } from './dateFilter'
import { isCaseRow, isPaymentRow } from './rowDetectors'
import { safeToString } from './tableUtils'

export interface PaymentRecoverySpeedSnapshot {
  avgDays: number | null
  recoveryCount: number
}

const norm = (v: unknown): string => safeToString(v).trim().toUpperCase()

/**
 * Computes payment recovery speed for a given bundle (already filtered by branch/zone/state).
 * Average Days = avg(successful payment_date - case created_at)
 */
export function computePaymentRecoverySpeed(
  bundle: { cases: DcspTableRow[]; payments: DcspTableRow[] },
  dateRange: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): PaymentRecoverySpeedSnapshot {
  const { start, end } = getDateRangeBounds(dateRange, customFromDate, customToDate)

  // Index cases by case_id with parsed created date.
  const caseById = new Map<string, Date>()
  bundle.cases.forEach((row) => {
    if (!isCaseRow(row)) return
    const caseId = safeToString(row.case_id).trim()
    if (!caseId) return
    const created = extractRowDate(row)
    if (!created) return
    caseById.set(caseId, created)
  })

  let sum = 0
  let cnt = 0

  bundle.payments.forEach((row) => {
    if (!isPaymentRow(row)) return

    const paymentStatus = norm((row.payment_status ?? row.status ?? row.response_status) as unknown)
    const isSuccessful = paymentStatus === 'SUCCESS'
    if (!isSuccessful) return

    const caseId = safeToString(row.case_id).trim()
    if (!caseId) return

    const createdDate = caseById.get(caseId)
    if (!createdDate) return

    const paymentDate = extractRowDate(row)
    if (!paymentDate) return

    if (paymentDate < start || paymentDate > end) return

    const delta = paymentDate.getTime() - createdDate.getTime()
    const days = delta / (1000 * 60 * 60 * 24)

    if (!Number.isFinite(days)) return

    sum += days
    cnt += 1
  })

  return {
    avgDays: cnt > 0 ? sum / cnt : null,
    recoveryCount: cnt,
  }
}

export function formatAvgDays(avgDays: number | null): string {
  if (avgDays == null) return '—'
  const rounded = Math.round(avgDays * 10) / 10
  return `${rounded} days`
}

export function computePreviousPeriodBounds(
  dateRange: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): { prevStart: Date; prevEnd: Date } {
  const { start, end } = getDateRangeBounds(dateRange, customFromDate, customToDate)
  const durationMs = end.getTime() - start.getTime()
  const prevEnd = new Date(start)
  const prevStart = new Date(prevEnd.getTime() - durationMs)
  return { prevStart, prevEnd }
}

export function computePaymentRecoverySpeedWithPrev(
  bundle: { cases: DcspTableRow[]; payments: DcspTableRow[] },
  dateRange: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): { current: PaymentRecoverySpeedSnapshot; previous: PaymentRecoverySpeedSnapshot } {
  const current = computePaymentRecoverySpeed(bundle, dateRange, customFromDate, customToDate)

  const { prevStart, prevEnd } = computePreviousPeriodBounds(dateRange, customFromDate, customToDate)
  const prevFrom = prevStart.toISOString().slice(0, 10)
  const prevTo = prevEnd.toISOString().slice(0, 10)
  const previous = computePaymentRecoverySpeed(bundle, 'Custom Range', prevFrom, prevTo)

  return { current, previous }
}

