// Analytics Feature Types

export interface RadarDataPoint {
  metric: string
  value: number
  fullMark: number
}

export interface StrategyRow {
  name: string
  percentage: number
  target: number
  color: string
}

export interface HourlyCallData {
  hour: string
  calls: number
  responses: number
}

export interface ProductDistribution {
  name: string
  value: number
  color: string
}

export interface BounceReason {
  reason: string
  count: number
  percentage: number
  color: string
}

export interface KPICard {
  id: string
  title: string
  value: string
  subtitle: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  iconType: 'target' | 'zap' | 'clock' | 'trending'
  iconColor: string
  bgColor: string
}

export type DateFilterOption = 'This Month' | 'Last 7 Days' | 'Last 30 Days' | 'Last Quarter' | 'This Year'
