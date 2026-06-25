// ─── ChartCard Component ──────────────────────────────────────────────────────

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
        bg-white rounded-[14px] p-6 shadow-sm border border-gray-100
        hover:shadow-md hover:-translate-y-[2px]
        transition-all duration-200 ease-out
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[18px] font-semibold text-[#00044A] leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
        {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
      </div>
      {children}
    </div>
  )
}
