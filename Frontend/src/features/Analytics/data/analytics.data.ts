// ─── Analytics Mock Data ──────────────────────────────────────────────────────

import type {
  RadarDataPoint,
  StrategyRow,
  HourlyCallData,
  ProductDistribution,
  BounceReason,
  KPICard,
} from '../types/analytics.types'

export const radarData: RadarDataPoint[] = [
  { metric: 'Contact Rate', value: 78, fullMark: 100 },
  { metric: 'Response Rate', value: 82, fullMark: 100 },
  { metric: 'PTP Rate', value: 71, fullMark: 100 },
  { metric: 'Resolution', value: 84, fullMark: 100 },
  { metric: 'Digital %', value: 69, fullMark: 100 },
  { metric: 'SLA Met', value: 90, fullMark: 100 },
]

export const strategyData: StrategyRow[] = [
  { name: 'Soft Collection', percentage: 72, target: 70, color: '#22C55E' },
  { name: 'Medium Pressure', percentage: 58, target: 55, color: '#22C55E' },
  { name: 'Aggressive', percentage: 45, target: 40, color: '#22C55E' },
  { name: 'Legal Action', percentage: 32, target: 30, color: '#22C55E' },
]

export const hourlyCallData: HourlyCallData[] = [
  { hour: '9 AM', calls: 850, responses: 350 },
  { hour: '10 AM', calls: 1250, responses: 500 },
  { hour: '11 AM', calls: 1450, responses: 680 },
  { hour: '12 PM', calls: 980, responses: 420 },
  { hour: '1 PM', calls: 620, responses: 260 },
  { hour: '2 PM', calls: 1400, responses: 610 },
  { hour: '3 PM', calls: 1550, responses: 720 },
  { hour: '4 PM', calls: 1280, responses: 590 },
  { hour: '5 PM', calls: 1160, responses: 510 },
  { hour: '6 PM', calls: 980, responses: 400 },
]

export const productDistribution: ProductDistribution[] = [
  { name: 'Personal Loan', value: 34, color: '#38BDF8' },
  { name: 'Business Loan', value: 22, color: '#22C55E' },
  { name: 'Home Loan', value: 18, color: '#FACC15' },
  { name: 'Auto Loan', value: 15, color: '#A78BFA' },
  { name: 'Credit Card', value: 11, color: '#EF4444' },
]

export const bounceReasons: BounceReason[] = [
  { reason: 'Insufficient Funds', count: 12500, percentage: 45, color: '#38BDF8' },
  { reason: 'Account Closed', count: 5800, percentage: 21, color: '#22C55E' },
  { reason: 'Payment Stopped', count: 4200, percentage: 15, color: '#FACC15' },
  { reason: 'Technical Error', count: 3100, percentage: 11, color: '#A78BFA' },
  { reason: 'Others', count: 2200, percentage: 8, color: '#EF4444' },
]

export const kpiCards: KPICard[] = [
  {
    id: 'target-achievement',
    title: 'Target Achievement',
    value: '101.4%',
    subtitle: 'Above Target',
    trend: '+1.4%',
    trendDirection: 'up',
    iconType: 'target',
    iconColor: '#22C55E',
    bgColor: 'bg-green-50',
  },
  {
    id: 'automation-rate',
    title: 'Automation Rate',
    value: '42.3%',
    subtitle: 'Digital Channels',
    trend: '+5.1%',
    trendDirection: 'up',
    iconType: 'zap',
    iconColor: '#38BDF8',
    bgColor: 'bg-sky-50',
  },
  {
    id: 'avg-resolution-time',
    title: 'Avg Resolution Time',
    value: '18 Days',
    subtitle: '2 days faster than last month',
    trend: '-2 days',
    trendDirection: 'up',
    iconType: 'clock',
    iconColor: '#FACC15',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'first-contact-resolution',
    title: 'First Contact Resolution',
    value: '24.8%',
    subtitle: 'Month over month',
    trend: '+3.2%',
    trendDirection: 'up',
    iconType: 'trending',
    iconColor: '#A78BFA',
    bgColor: 'bg-purple-50',
  },
]
