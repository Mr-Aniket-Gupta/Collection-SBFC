// Top Navbar

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Bell, ChevronDown } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { toast } from 'sonner'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/analytics': {
    title: 'Analytics Dashboard',
    subtitle: 'Advanced analytics and performance insights',
  },
  '/reports': {
    title: 'Reports & Analytics',
    subtitle: 'Comprehensive collection analytics and MIS reports',
  },
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of collection performance',
  },
  '/cases': {
    title: 'Case Management',
    subtitle: 'Manage and track collection cases',
  },
  '/strategy': {
    title: 'Strategy Builder',
    subtitle: 'Configure and manage collection strategies',
  },
  '/approvals': {
    title: 'Approvals',
    subtitle: 'Review and approve pending items',
  },
  '/users': {
    title: 'User Management',
    subtitle: 'Manage users, roles and permissions',
  },
  '/masters': {
    title: 'Masters Config',
    subtitle: 'Configure master data and settings',
  },
  '/communication': {
    title: 'Communication Config',
    subtitle: 'Manage communication templates and channels',
  },
}

export const Header: React.FC = () => {
  const [dateRange, setDateRange] = useState('This Month')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const pageInfo = PAGE_TITLES[location.pathname] ?? {
    title: 'SBFC Collections',
    subtitle: 'Digital collection management platform',
  }

  const handleSelectRange = (range: string) => {
    setDateRange(range)
    setIsDropdownOpen(false)
    toast.success(`Date filter: ${range}`)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="bg-[var(--color-navy)] text-white border-b border-white/10 py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none shrink-0 relative"
      role="banner"
    >
      {/* Page Title and Subtitle */}
      <div>
        <h2 className="text-[17px] font-bold text-slate-100 leading-tight">{pageInfo.title}</h2>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{pageInfo.subtitle}</p>
      </div>

      {/* Right-side Actions */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Date Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            id="header-date-filter"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer transition-all duration-200"
            role="button"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </div>

          {isDropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 mt-1.5 w-40 bg-[var(--color-blue)] border border-white/10 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-xs"
            >
              {['This Month', 'Last 7 Days', 'Last 30 Days', 'Last Quarter', 'Last 6 Months'].map(
                (range) => (
                  <button
                    key={range}
                    role="option"
                    aria-selected={dateRange === range}
                    onClick={() => handleSelectRange(range)}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors cursor-pointer block ${
                      dateRange === range
                        ? 'text-[var(--color-gold)] font-bold bg-white/5'
                        : 'text-slate-300'
                    }`}
                  >
                    {range}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="header-notifications-btn"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="View notifications"
            className="relative p-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-slate-200 cursor-pointer transition-all duration-200"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-72 bg-[var(--color-blue)] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-100">Notifications</span>
                <span className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.14)] px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>
              {[
                { title: 'Target Exceeded', desc: 'Soft Collection hit 101.4%', time: '2m ago', dot: '#CE9B01' },
                { title: 'SLA Alert', desc: 'Legal Action approaching SLA', time: '18m ago', dot: '#D9EAF5' },
                { title: 'Report Ready', desc: 'Monthly MIS report generated', time: '1h ago', dot: '#FFFFFF' },
              ].map((n) => (
                <button
                  key={n.title}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  onClick={() => setNotifOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-200 truncate">{n.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{n.desc}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{n.time}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* User Profile */}
        <UserMenu />
      </div>
    </header>
  )
}
