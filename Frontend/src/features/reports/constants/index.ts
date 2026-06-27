import {
  FileSpreadsheet,
  Layers,
  Smartphone,
  Coins,
  Network,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'
import React from 'react'

export interface CategoryConfig {
  id: string
  label: string
  reportsCount: number
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  borderColor: string
}

export const REPORT_CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: 'Recovery MIS',
    label: 'Recovery MIS',
    reportsCount: 12,
    icon: FileSpreadsheet,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-navy)]',
    borderColor: 'border-[rgba(5,0,88,0.12)]'
  },
  {
    id: 'Bucket-wise MIS',
    label: 'Bucket-wise MIS',
    reportsCount: 8,
    icon: Layers,
    bgColor: 'bg-[rgba(206,155,1,0.13)]',
    iconColor: 'text-[var(--color-gold)]',
    borderColor: 'border-[rgba(206,155,1,0.24)]'
  },
  {
    id: 'Digital Recovery',
    label: 'Digital Recovery',
    reportsCount: 6,
    icon: Smartphone,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-blue)]',
    borderColor: 'border-[rgba(0,1,130,0.14)]'
  },
  {
    id: 'Payment MIS',
    label: 'Payment MIS',
    reportsCount: 9,
    icon: Coins,
    bgColor: 'bg-[rgba(206,155,1,0.13)]',
    iconColor: 'text-[var(--color-gold)]',
    borderColor: 'border-[rgba(206,155,1,0.24)]'
  },
  {
    id: 'Strategy Reports',
    label: 'Strategy Reports',
    reportsCount: 5,
    icon: Network,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-navy)]',
    borderColor: 'border-[rgba(5,0,88,0.12)]'
  },
  {
    id: 'Communication Reports',
    label: 'Communication Reports',
    reportsCount: 7,
    icon: MessageSquare,
    bgColor: 'bg-[rgba(206,155,1,0.13)]',
    iconColor: 'text-[var(--color-gold)]',
    borderColor: 'border-[rgba(206,155,1,0.24)]'
  },
  {
    id: 'Bounce Analysis',
    label: 'Bounce Analysis',
    reportsCount: 4,
    icon: AlertTriangle,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-blue)]',
    borderColor: 'border-[rgba(0,1,130,0.14)]'
  }
]

// Brand Color Palette for Recharts
export const CHART_COLORS = {
  navy: '#050058',
  blue: '#000182',
  ice: '#D9EAF5',
  white: '#FFFFFF',
  gold: '#CE9B01',
  navySoft: 'rgba(5, 0, 88, 0.72)',
  blueSoft: 'rgba(0, 1, 130, 0.68)',
  goldSoft: 'rgba(206, 155, 1, 0.72)',
  muted: '#5f6f88'
}

export const BUCKET_CHART_COLORS = [
  '#000182',
  '#050058',
  '#CE9B01',
  'rgba(0, 1, 130, 0.52)',
  'rgba(206, 155, 1, 0.58)'
]

export const RECOVERY_PIE_COLORS = [
  '#000182',
  '#CE9B01',
  '#050058',
  '#D9EAF5'
]
