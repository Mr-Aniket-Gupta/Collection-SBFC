import type { DateRangeOption, DcspTableRow } from '../types'

const DATE_KEYS = ['created_at', 'createdDate', 'created_date', 'updated_at', 'payment_date', 'ptp_date']

export const DEFAULT_DATE_RANGE: DateRangeOption = 'Last 6 Months'
export const CUSTOM_RANGE_MAX_MONTHS = 6

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  'This Month',
  'Last 7 Days',
  'Last 30 Days',
  'Last Quarter',
  'Last 6 Months',
  'Custom Range',
]

const startOfDay = (date: Date): Date => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const endOfDay = (date: Date): Date => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10)

/** Default "From" date when switching to Custom Range — 6 months before today. */
export function getDefaultCustomFromDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - CUSTOM_RANGE_MAX_MONTHS)
  return toIsoDate(date)
}

/** Default "To" date when switching to Custom Range — today. */
export function getDefaultCustomToDate(): string {
  return toIsoDate(new Date())
}

/** Latest allowed To date: From + 6 months, capped at today. */
export function getMaxCustomToDate(fromDate: string): string {
  const from = startOfDay(new Date(fromDate))
  const max = new Date(from)
  max.setMonth(max.getMonth() + CUSTOM_RANGE_MAX_MONTHS)
  const today = endOfDay(new Date())
  return toIsoDate(max > today ? today : max)
}

/** Keeps To within [From, From + 6 months] and not beyond today. */
export function clampCustomToDate(fromDate: string, toDate: string): string {
  const maxTo = getMaxCustomToDate(fromDate)
  if (toDate < fromDate) return fromDate
  if (toDate > maxTo) return maxTo
  return toDate
}

export interface CustomDateRange {
  from: string
  to: string
}

/** Returns start/end bounds for a date-range option. */
export function getDateRangeBounds(
  option: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): { start: Date; end: Date } {
  const today = endOfDay(new Date())

  if (option === 'Custom Range' && customFromDate && customToDate) {
    const start = startOfDay(new Date(customFromDate))
    const clampedTo = clampCustomToDate(customFromDate, customToDate)
    const end = endOfDay(new Date(clampedTo))
    return { start, end: end > today ? today : end }
  }

  return { start: getDateRangeStart(option), end: today }
}

/** Returns the start date for a given date-range filter option. */
export function getDateRangeStart(option: DateRangeOption): Date {
  const now = new Date()

  switch (option) {
    case 'This Month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'Last 7 Days':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case 'Last 30 Days':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    case 'Last Quarter':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case 'Last 6 Months':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case 'Custom Range':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
  }
}

/** Human-readable label for the active date filter. */
export function formatDateRangeLabel(
  option: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): string {
  if (option !== 'Custom Range' || !customFromDate || !customToDate) return option

  const { start, end } = getDateRangeBounds(option, customFromDate, customToDate)
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return `Custom · ${fmt(start)} – ${fmt(end)}`
}

/** Extracts a parseable date from a DCSP row using common date column keys. */
export function extractRowDate(row: DcspTableRow): Date | null {
  for (const key of DATE_KEYS) {
    const value = row[key]
    if (value == null || value === '') continue
    const parsed = new Date(String(value))
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return null
}

/** Checks whether a row falls within the selected date range. Rows without dates are included. */
export function isWithinDateRange(
  row: DcspTableRow,
  option: DateRangeOption,
  customFromDate?: string,
  customToDate?: string,
): boolean {
  const rowDate = extractRowDate(row)
  if (!rowDate) return true
  const { start, end } = getDateRangeBounds(option, customFromDate, customToDate)
  return rowDate >= start && rowDate <= end
}
