// Dropdown -> Branch, Zone, State


import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ReportSelectFilterProps {
  label: string
  value: string
  options: string[]
  allLabel: string
  onChange: (value: string) => void
}

export const ReportSelectFilter: React.FC<ReportSelectFilterProps> = ({
  label,
  value,
  options,
  allLabel,
  onChange,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = value || allLabel

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="reports-date-filter flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.12)] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--color-navy)] shadow-sm hover:border-[var(--color-gold)] hover:bg-[var(--color-ice)] transition-all"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
          {label}
        </span>
        <span>{displayValue}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-ink-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="reports-date-dropdown absolute right-0 z-50 mt-2 max-h-60 w-52 overflow-y-auto rounded-xl border border-[rgba(5,0,88,0.12)] bg-white py-1.5 shadow-xl"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${!value
                ? 'bg-[var(--color-navy)] text-white'
                : 'text-[var(--color-navy)] hover:bg-[var(--color-ice)]'
              }`}
          >
            {allLabel}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${value === option
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
