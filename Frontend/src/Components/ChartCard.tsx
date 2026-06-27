// ChartCard Component (Common)
// Shared between Reports and Analytics features

import React from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerAction,
}) => {
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
        {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
      </div>
      {children}
    </div>
  )
}
