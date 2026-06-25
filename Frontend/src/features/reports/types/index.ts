export type ReportCategory =
  | 'recovery'
  | 'bucket'
  | 'digital'
  | 'payment'
  | 'strategy'
  | 'communication'
  | 'bounce'

export type ReportStatus = 'Scheduled' | 'Ready' | 'Failed'

export interface ReportItem {
  id: string
  name: string
  category: string
  createdBy: string
  createdDate: string
  status: ReportStatus
  sqlQuery: string
  recordCount: number
  fileSize: string
  cronExpression: string
  description: string
}

export interface MetricSummary {
  totalCollection: number // value in Rs
  totalCollectionTrend: number // % change, e.g. -3.9
  digitalCollection: number // value in Rs
  digitalCollectionTrend: number // % change, e.g. 12.6
  resolutionRate: number // value in %
  resolutionRateTrend: number // % change, e.g. 2.9
  casesResolved: number // integer cases
  casesResolvedTrend: number // % change, e.g. 8.8
}

export interface ChannelConversionData {
  channel: string
  sent: number
  responded: number
  converted: number
}

export interface BucketWiseTrendData {
  month: string
  '0-30 DPD': number
  '31-60 DPD': number
  '61-90 DPD': number
  '91-120 DPD': number
  '120+ DPD': number
}

export interface CollectionTrendData {
  month: string
  collection: number
  target: number
}

export interface RecoveryDistributionData {
  name: string
  value: number
}

export interface ReportMetricsPayload {
  kpis: MetricSummary
  channelConversion: ChannelConversionData[]
  bucketTrend: BucketWiseTrendData[]
  collectionTrend: CollectionTrendData[]
  recoveryDistribution: RecoveryDistributionData[]
}

export interface FilterState {
  category: string // 'All' or specific display category
  status: string // 'All' or specific status
  search: string
  page: number
  limit: number
  sortBy: keyof ReportItem
  sortOrder: 'asc' | 'desc'
}
