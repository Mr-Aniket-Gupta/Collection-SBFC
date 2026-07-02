// Date Filter Dropdown

import React, { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import type { DateRangeOption } from '../types'
import {
  clampCustomToDate,
  DATE_RANGE_OPTIONS,
  formatDateRangeLabel,
  getDefaultCustomFromDate,
  getDefaultCustomToDate,
  getMaxCustomToDate,
} from '../utils/dateFilter'

interface DateRangeFilterProps {
  value: DateRangeOption
  customFromDate: string
  customToDate: string
  onChange: (option: DateRangeOption) => void
  onCustomFromDateChange: (date: string) => void
  onCustomToDateChange: (date: string) => void
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  customFromDate,
  customToDate,
  onChange,
  onCustomFromDateChange,
  onCustomToDateChange,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = getDefaultCustomToDate()
  const fromValue = customFromDate || getDefaultCustomFromDate()
  const toValue = customToDate || getDefaultCustomToDate()
  const maxToDate = getMaxCustomToDate(fromValue)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectOption = (option: DateRangeOption) => {
    onChange(option)
    if (option === 'Custom Range') {
      const from = customFromDate || getDefaultCustomFromDate()
      const to = customToDate || getDefaultCustomToDate()
      if (!customFromDate) onCustomFromDateChange(from)
      if (!customToDate) onCustomToDateChange(clampCustomToDate(from, to))
    }
    if (option !== 'Custom Range') setOpen(false)
  }

  const handleFromChange = (date: string) => {
    onCustomFromDateChange(date)
    onCustomToDateChange(clampCustomToDate(date, toValue))
  }

  const handleToChange = (date: string) => {
    onCustomToDateChange(clampCustomToDate(fromValue, date))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="reports-date-filter flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.12)] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--color-navy)] shadow-sm hover:border-[var(--color-gold)] hover:bg-[var(--color-ice)] transition-all"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Calendar className="h-3.5 w-3.5 text-[var(--color-gold)]" />
        <span>{formatDateRangeLabel(value, customFromDate, customToDate)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-ink-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="reports-date-dropdown absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[rgba(5,0,88,0.12)] bg-white py-1.5 shadow-xl"
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => handleSelectOption(option)}
              className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                value === option
                  ? 'bg-[var(--color-navy)] text-white'
                  : 'text-[var(--color-navy)] hover:bg-[var(--color-ice)]'
              }`}
            >
              {option}
            </button>
          ))}

          {value === 'Custom Range' && (
            <div className="border-t border-[rgba(5,0,88,0.08)] px-4 py-3 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromValue}
                  max={today}
                  onChange={(event) => handleFromChange(event.target.value)}
                  className="w-full rounded-lg border border-[rgba(5,0,88,0.12)] px-2.5 py-1.5 text-[13px] text-[var(--color-navy)] focus:border-[var(--color-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
                  To Date
                </label>
                <input
                  type="date"
                  value={clampCustomToDate(fromValue, toValue)}
                  min={fromValue}
                  max={maxToDate}
                  onChange={(event) => handleToChange(event.target.value)}
                  className="w-full rounded-lg border border-[rgba(5,0,88,0.12)] px-2.5 py-1.5 text-[13px] text-[var(--color-navy)] focus:border-[var(--color-gold)] focus:outline-none"
                />
              </div>

              <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">
                To date must be on or after From date and within 6 months of From date.
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-[var(--color-gold)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-navy)] hover:brightness-105"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
