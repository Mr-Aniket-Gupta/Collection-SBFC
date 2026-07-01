import type { DateRangeOption, DcspTableRow } from '../types'

const DATE_KEYS = ['created_at', 'createdDate', 'created_date', 'updated_at', 'payment_date', 'ptp_date']

export const DEFAULT_DATE_RANGE: DateRangeOption = 'Last 6 Months'

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  'This Month',
  'Last 7 Days',
  'Last 30 Days',
  'Last Quarter',
  'Last 6 Months',
]

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
  }
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
export function isWithinDateRange(row: DcspTableRow, option: DateRangeOption): boolean {
  const rowDate = extractRowDate(row)
  if (!rowDate) return true
  return rowDate >= getDateRangeStart(option) && rowDate <= new Date()
}
