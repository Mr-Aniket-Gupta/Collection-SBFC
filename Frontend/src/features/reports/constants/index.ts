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
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  borderColor: string
}

export const REPORT_CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: 'cases',
    label: 'Cases',
    icon: FileSpreadsheet,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-navy)]',
    borderColor: 'border-[rgba(5,0,88,0.12)]'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: Layers,
    bgColor: 'bg-[rgba(206,155,1,0.13)]',
    iconColor: 'text-[var(--color-gold)]',
    borderColor: 'border-[rgba(206,155,1,0.24)]'
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: Smartphone,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-blue)]',
    borderColor: 'border-[rgba(0,1,130,0.14)]'
  },
  {
    id: 'strategies',
    label: 'Strategies',
    icon: Coins,
    bgColor: 'bg-[rgba(206,155,1,0.13)]',
    iconColor: 'text-[var(--color-gold)]',
    borderColor: 'border-[rgba(206,155,1,0.24)]'
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Network,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-navy)]',
    borderColor: 'border-[rgba(5,0,88,0.12)]'
  },
  {
    id: 'allocations',
    label: 'Allocations',
    icon: MessageSquare,
    bgColor: 'bg-[rgba(206,155,1,0.13)]',
    iconColor: 'text-[var(--color-gold)]',
    borderColor: 'border-[rgba(206,155,1,0.24)]'
  },
  {
    id: 'ptps',
    label: 'PTPs',
    icon: AlertTriangle,
    bgColor: 'bg-[var(--color-ice)]',
    iconColor: 'text-[var(--color-blue)]',
    borderColor: 'border-[rgba(0,1,130,0.14)]'
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
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
