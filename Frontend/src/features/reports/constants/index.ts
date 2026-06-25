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
    bgColor: 'bg-indigo-50/70',
    iconColor: 'text-indigo-650',
    borderColor: 'border-indigo-100'
  },
  {
    id: 'Bucket-wise MIS',
    label: 'Bucket-wise MIS',
    reportsCount: 8,
    icon: Layers,
    bgColor: 'bg-amber-50/70',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-100'
  },
  {
    id: 'Digital Recovery',
    label: 'Digital Recovery',
    reportsCount: 6,
    icon: Smartphone,
    bgColor: 'bg-sky-50/70',
    iconColor: 'text-sky-600',
    borderColor: 'border-sky-100'
  },
  {
    id: 'Payment MIS',
    label: 'Payment MIS',
    reportsCount: 9,
    icon: Coins,
    bgColor: 'bg-rose-50/70',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-100'
  },
  {
    id: 'Strategy Reports',
    label: 'Strategy Reports',
    reportsCount: 5,
    icon: Network,
    bgColor: 'bg-purple-50/70',
    iconColor: 'text-purple-650',
    borderColor: 'border-purple-100'
  },
  {
    id: 'Communication Reports',
    label: 'Communication Reports',
    reportsCount: 7,
    icon: MessageSquare,
    bgColor: 'bg-orange-50/70',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-100'
  },
  {
    id: 'Bounce Analysis',
    label: 'Bounce Analysis',
    reportsCount: 4,
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50/70',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-100'
  }
]

// Brand Color Palette for Recharts
export const CHART_COLORS = {
  indigo: '#0c0836',
  indigoLight: '#4f46e5',
  amber: '#d97706',
  yellow: '#f59e0b',
  yellowLight: '#fbbf24',
  sky: '#0284c7',
  rose: '#e11d48',
  emerald: '#10b981',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  slate: '#64748b'
}

export const BUCKET_CHART_COLORS = [
  '#3b82f6', // 0-30 DPD (Blue)
  '#6366f1', // 31-60 DPD (Indigo)
  '#f59e0b', // 61-90 DPD (Yellow)
  '#f97316', // 91-120 DPD (Orange)
  '#ef4444'  // 120+ DPD (Red)
]

export const RECOVERY_PIE_COLORS = [
  '#3b82f6', // Digital
  '#f59e0b', // Agency
  '#f97316', // Field
  '#8b5cf6'  // Telecalling
]
