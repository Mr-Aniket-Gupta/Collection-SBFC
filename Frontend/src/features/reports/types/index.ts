/** Row shape returned by the generic DCSP query endpoints. */
export interface DcspTableRow {
  [key: string]: string | number | boolean | null
}

/** Paginated response wrapper from the Reports API. */
export interface DcspPagedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export type DateRangeOption =
  | 'This Month'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'Last Quarter'
  | 'Last 6 Months'
  | 'Custom Range'

export type SortOrder = 'asc' | 'desc'

export interface ChannelConversionData {
  channel: string
  sent: number
  responded: number
}

export interface BucketWiseTrendData {
  month: string
  '0-30': number
  '31-60': number
  '61-90': number
  '90+': number
}

export interface CollectionTrendData {
  month: string
  success: number
  failed: number
  pending: number
}

export interface RecoveryDistributionData {
  name: string
  value: number
  amount?: number
}

export interface TrendSeriesData {
  label: string
  value: number
}

export interface PaymentVolumeTrendData {
  month: string
  volume: number
  amount: number
  success: number
  failed: number
  pending: number
}

export interface FunnelStageData {
  stage: string
  count: number
  percent: number
}

export interface ReportLibraryRow {
  id: string
  name: string
  category: string
  createdBy: string
  date: string
  status: string
  source: DcspTableRow
}

export type { ReportTableBundle, GlobalFilterContext, GlobalFilterIds } from '../utils/reportFilterEngine'
