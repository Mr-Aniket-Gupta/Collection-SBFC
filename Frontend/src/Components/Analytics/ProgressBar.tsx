// ProgressBar Component

import React, { useEffect, useRef, useState } from 'react'

interface ProgressBarProps {
  label?: string
  percentage: number
  target?: number
  color?: string
  trackColor?: string
  showPercentageBadge?: boolean
  showTargetLabel?: boolean
  animated?: boolean
  height?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percentage,
  target,
  color = '#CE9B01',
  trackColor = '#D9EAF5',
  showPercentageBadge = true,
  showTargetLabel = true,
  animated = true,
  height = 'h-2',
}) => {
  const [width, setWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  useEffect(() => {
    if (!animated) {
      setWidth(percentage)
      return
    }
    // Trigger animation after mount
    const timer = setTimeout(() => setWidth(percentage), 120)
    return () => clearTimeout(timer)
  }, [percentage, animated])

  return (
    <div className="flex flex-col gap-2">
      {/* Row header */}
      {(label || showPercentageBadge) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-[13px] font-medium text-[var(--color-navy)] truncate">{label}</span>
          )}
          {showPercentageBadge && (
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-[13px] font-bold text-[var(--color-navy)]">{formatPercent(percentage)}</span>
              {target !== undefined && showTargetLabel && (
                <span className="text-[11px] text-[var(--color-ink-muted)] font-medium">
                  Target {formatPercent(target)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Track */}
      <div
        ref={ref}
        className={`w-full ${height} rounded-full overflow-hidden`}
        style={{ backgroundColor: trackColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
