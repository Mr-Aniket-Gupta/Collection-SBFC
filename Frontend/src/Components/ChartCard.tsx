// ChartCard Component (Common)
// Shared between Reports and Analytics features

import React, { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { ChartDataModal } from './ChartDataModal'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
  data?: any[]
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerAction,
  data,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div
      className={`
        surface-card rounded-xl p-5
        hover:-translate-y-[2px] hover:border-[rgba(206,155,1,0.4)]
        transition-all duration-200 ease-out
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[16px] font-bold text-[var(--color-navy)] leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-[var(--color-ink-muted)] mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] hover:bg-[rgba(5,0,88,0.06)] transition-colors"
              title="View Data"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {headerAction}
        </div>
      </div>
      {children}
      {data && (
        <ChartDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`${title} Data`}
          data={data}
        />
      )}
    </div>
  )
}
