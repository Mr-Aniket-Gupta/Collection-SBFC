import React, { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import type { DateRangeOption } from '../types'
import { DATE_RANGE_OPTIONS } from '../utils/dateFilter'

interface DateRangeFilterProps {
  value: DateRangeOption
  onChange: (option: DateRangeOption) => void
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        <span>{value}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-ink-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="listbox" className="reports-date-dropdown absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[rgba(5,0,88,0.12)] bg-white py-1.5 shadow-xl">
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                value === option
                  ? 'bg-[var(--color-navy)] text-white'
                  : 'text-[var(--color-navy)] hover:bg-[var(--color-ice)]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
