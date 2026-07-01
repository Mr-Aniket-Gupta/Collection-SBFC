import type {
  BucketWiseTrendData,
  ChannelConversionData,
  CollectionTrendData,
  FunnelStageData,
  PaymentVolumeTrendData,
  RecoveryDistributionData,
  ReportLibraryRow,
  TrendSeriesData,
} from '../types'
import { isCommunicationRow, isPaymentRow, isStrategyRow, isCaseRow } from './rowDetectors'
import { extractRowDate } from './dateFilter'
import { safeToString } from './tableUtils'

export const COMMUNICATION_CHANNELS = ['SMS', 'WhatsApp Messages', 'Email', 'AI Call', 'Field visit'] as const
export const DPD_BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const

const truncateLabel = (label: string, max = 16): string =>
  label.length > max ? `${label.slice(0, max - 1)}…` : label

const monthKey = (date: Date): string =>
  date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

const monthSortKey = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), 1)

/** Maps raw channel text to standard communication channel labels. */
export function normalizeCommunicationChannel(raw: string): (typeof COMMUNICATION_CHANNELS)[number] | null {
  const value = raw.toLowerCase()
  if (!value) return null
  if (value.includes('whatsapp') || value.includes('wa')) return 'WhatsApp Messages'
  if (value.includes('sms')) return 'SMS'
  if (value.includes('email') || value.includes('mail')) return 'Email'
  if (value.includes('field') || value.includes('visit')) return 'Field visit'
  if (value.includes('ai') || value.includes('ivr') || value.includes('call')) return 'AI Call'
  return null
}

/** Maps the strategy bucket column to the standard bucket ranges, with legacy fallbacks. */
export function normalizeDpdBucket(row: Record<string, unknown>): (typeof DPD_BUCKETS)[number] {
  const dpd = Number(row.dpd)
  if (!Number.isNaN(dpd)) {
    if (dpd <= 30) return '0-30'
    if (dpd <= 60) return '31-60'
    if (dpd <= 90) return '61-90'
    return '90+'
  }

  const bucket = safeToString(row.bucket).trim().toUpperCase()

  // strategies.bucket: X or 1 -> 0-30, 2 -> 31-60, 3 -> 61-90, NPA -> 90+
  if (bucket === 'X' || bucket === '1') return '0-30'
  if (bucket === '2') return '31-60'
  if (bucket === '3') return '61-90'
  if (bucket === 'NPA') return '90+'

  if (bucket.includes('0') && bucket.includes('30')) return '0-30'
  if (bucket.includes('31') && bucket.includes('60')) return '31-60'
  if (bucket.includes('61') && bucket.includes('90')) return '61-90'
  if (bucket.includes('90') || bucket.includes('120') || bucket.includes('+')) return '90+'

  return '0-30'
}

const normStatus = (value: unknown): string => safeToString(value).trim().toUpperCase()

const parsePaymentAmount = (row: Record<string, unknown>): number => {
  const amount = Number(row.payment_amount ?? row.amount ?? 0)
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0
}

/** Channel Conversion Rate — counts by SMS, WhatsApp, Email, AI Call, Field visit. */
export function buildChannelConversionData(reports: ReportLibraryRow[]): ChannelConversionData[] {
  const counts = new Map<string, number>()
  COMMUNICATION_CHANNELS.forEach((channel) => counts.set(channel, 0))

  reports.forEach(({ source }) => {
    if (!isCommunicationRow(source)) return
    const channel = normalizeCommunicationChannel(safeToString(source.channel))
    if (!channel) return
    counts.set(channel, (counts.get(channel) ?? 0) + 1)
  })

  return COMMUNICATION_CHANNELS.map((channel) => {
    const total = counts.get(channel) ?? 0
    const responded = reports.filter(({ source }) => {
      if (!isCommunicationRow(source)) return false
      if (normalizeCommunicationChannel(safeToString(source.channel)) !== channel) return false
      const status = safeToString(source.response_status || source.status).toLowerCase()
      return status.includes('deliver') || status.includes('read') || status.includes('respond')
    }).length

    return { channel, sent: total, responded }
  })
}

/** Bucket-wise Trend — strategy buckets (0-30, 31-60, 61-90, 90+) grouped by month. */
export function buildBucketWiseTrendData(reports: ReportLibraryRow[]): BucketWiseTrendData[] {
  const summary = new Map<string, BucketWiseTrendData>()

  reports.forEach(({ source }) => {
    if (!isStrategyRow(source)) return
    const date = extractRowDate(source)
    const key = date ? monthKey(date) : 'Unknown'
    const bucket = normalizeDpdBucket(source)

    if (!summary.has(key)) {
      summary.set(key, { month: truncateLabel(key, 12), '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 })
    }
    const entry = summary.get(key)!
    entry[bucket] += 1
  })

  if (summary.size === 0) {
    return [{ month: 'No data', '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }]
  }

  return Array.from(summary.values())
}

/** Collection Trend — monthly payment amounts by payment_status (SUCCESS, FAILED, PENDING). */
export function buildCollectionTrendData(reports: ReportLibraryRow[]): CollectionTrendData[] {
  const summary = new Map<string, { success: number; failed: number; pending: number }>()

  reports.forEach(({ source }) => {
    if (!isPaymentRow(source)) return
    const date = extractRowDate(source)
    const key = date ? monthKey(date) : 'Unknown'
    const amount = parsePaymentAmount(source)
    const status = normStatus(source.payment_status)

    if (!summary.has(key)) {
      summary.set(key, { success: 0, failed: 0, pending: 0 })
    }
    const entry = summary.get(key)!

    if (status === 'SUCCESS') entry.success += amount
    else if (status === 'FAILED') entry.failed += amount
    else if (status === 'PENDING') entry.pending += amount
  })

  if (summary.size === 0) {
    return [{ month: 'No data', success: 0, failed: 0, pending: 0 }]
  }

  return Array.from(summary.entries())
    .map(([month, values]) => ({
      month: truncateLabel(month, 12),
      success: Math.round(values.success),
      failed: Math.round(values.failed),
      pending: Math.round(values.pending),
    }))
}

/** Recovery Distribution — payment mode split from payments table. */
export function buildRecoveryDistributionData(reports: ReportLibraryRow[]): RecoveryDistributionData[] {
  const summary = new Map<string, { count: number; amount: number }>()

  reports.forEach(({ source }) => {
    if (!isPaymentRow(source)) return
    const mode = safeToString(source.payment_mode || source.payment_source || source.payment_status) || 'Unknown'
    const amount = parsePaymentAmount(source)
    const prev = summary.get(mode) ?? { count: 0, amount: 0 }
    summary.set(mode, { count: prev.count + 1, amount: prev.amount + amount })
  })

  if (summary.size === 0) {
    return [{ name: 'No payments', value: 100, amount: 0 }]
  }

  const total = Array.from(summary.values()).reduce((sum, val) => sum + val.count, 0) || 1
  return Array.from(summary.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, { count, amount }]) => ({
      name: truncateLabel(name, 14),
      value: Math.round((count / total) * 100),
      amount: Math.round(amount),
    }))
}

/** Trends tab — monthly payment volume with amount and status split from payments table. */
export function buildPaymentVolumeTrend(reports: ReportLibraryRow[]): PaymentVolumeTrendData[] {
  const summary = new Map<string, PaymentVolumeTrendData & { sortKey: number }>()
  reports.forEach(({ source }) => {
    if (!isPaymentRow(source)) return
    const date = extractRowDate(source)
    const key = date ? monthKey(date) : 'Unknown'
    const sortKey = date ? monthSortKey(date) : Number.MAX_SAFE_INTEGER
    const amount = parsePaymentAmount(source)
    const status = normStatus(source.payment_status)

    if (!summary.has(key)) {
      summary.set(key, { month: key, volume: 0, amount: 0, success: 0, failed: 0, pending: 0, sortKey })
    }

    const entry = summary.get(key)!
    entry.volume += 1
    entry.amount += amount
    if (status === 'SUCCESS') entry.success += amount
    else if (status === 'FAILED') entry.failed += amount
    else if (status === 'PENDING') entry.pending += amount
  })

  return Array.from(summary.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey, ...entry }) => ({
      month: truncateLabel(entry.month, 12),
      volume: Math.round(entry.volume),
      amount: Math.round(entry.amount),
      success: Math.round(entry.success),
      failed: Math.round(entry.failed),
      pending: Math.round(entry.pending),
    }))
}

/** Trends tab — top branches by active cases. */
export function buildBranchCaseTrend(reports: ReportLibraryRow[]): TrendSeriesData[] {
  const summary = new Map<string, number>()
  reports.forEach(({ source }) => {
    if (!isCaseRow(source)) return
    const branch = safeToString(source.branch || source.zone || source.state) || 'Unknown'
    if (safeToString(source.status).toLowerCase().includes('close')) return
    summary.set(branch, (summary.get(branch) ?? 0) + 1)
  })

  return Array.from(summary.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label: truncateLabel(label, 16), value }))
}

/** Funnel tab — communication delivery funnel from communications table. */
export function buildCommunicationFunnel(reports: ReportLibraryRow[]): FunnelStageData[] {
  const stages = [
    { stage: 'Sent', match: () => true },
    { stage: 'Delivered', match: (status: string) => status.includes('deliver') || status.includes('sent') || status.includes('success') },
    { stage: 'Read', match: (status: string) => status.includes('read') || status.includes('open') },
    { stage: 'Responded', match: (status: string) => status.includes('respond') || status.includes('reply') },
    { stage: 'Converted', match: (status: string) => status.includes('convert') || status.includes('paid') || status.includes('ptp') },
  ]

  const commRows = reports.filter(({ source }) => isCommunicationRow(source))
  const total = commRows.length || 1

  return stages.map(({ stage, match }) => {
    const count = commRows.filter(({ source }) => {
      const status = safeToString(source.response_status || source.status).toLowerCase()
      return match(status)
    }).length

    return {
      stage,
      count,
      percent: Math.round((count / total) * 100),
    }
  })
}
