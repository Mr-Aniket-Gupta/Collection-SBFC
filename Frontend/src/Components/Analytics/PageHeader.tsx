// PageHeader Component

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, RefreshCw, Calendar } from 'lucide-react'
import type { DateFilterOption } from '@/features/Analytics/types/analytics.types'

interface PageHeaderProps {
  title: string
  subtitle: string
  selectedDateFilter: DateFilterOption
  dateFilterOptions: DateFilterOption[]
  onDateFilterChange: (filter: DateFilterOption) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  selectedDateFilter,
  dateFilterOptions,
  onDateFilterChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="surface-card rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title Block */}
      <div>
        <h1 className="text-[24px] font-bold text-[var(--color-navy)] leading-tight">{title}</h1>
        <p className="text-[13px] text-[var(--color-ink-muted)] mt-0.5 font-medium">{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Date Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="analytics-date-filter"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="
              flex items-center gap-2 px-4 py-2.5 bg-white border border-[rgba(5,0,88,0.12)]
              rounded-lg text-[13px] font-semibold text-[var(--color-navy)]
              hover:border-[var(--color-gold)] hover:bg-[var(--color-ice)]
              transition-all duration-200 shadow-sm
            "
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" />
            <span>{selectedDateFilter}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--color-ink-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div
              role="listbox"
              className="
                absolute right-0 mt-2 w-44 bg-white border border-[rgba(5,0,88,0.12)]
                rounded-xl shadow-xl py-1.5 z-50 overflow-hidden
                animate-[fadeIn_0.15s_ease-out_forwards]
              "
            >
              {dateFilterOptions.map((option) => (
                <button
                  key={option}
                  role="option"
                  aria-selected={selectedDateFilter === option}
                  onClick={() => {
                    onDateFilterChange(option)
                    setIsDropdownOpen(false)
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 text-[13px] font-medium
                    transition-colors duration-150 cursor-pointer
                    ${
                      selectedDateFilter === option
                        ? 'bg-[var(--color-navy)] text-white'
                        : 'text-[var(--color-navy)] hover:bg-[var(--color-ice)]'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          id="analytics-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="
            flex items-center gap-2 px-4 py-2.5 bg-[var(--color-gold)] text-[var(--color-navy)]
            rounded-lg text-[13px] font-bold
            hover:brightness-95 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm
          "
          aria-label="Refresh analytics data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  )
}

export default PageHeader
