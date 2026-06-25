import React, { useState, useRef, useEffect } from 'react'
import { Calendar, RotateCw, Bell, ChevronDown } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { toast } from 'sonner'

export const Header: React.FC = () => {
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleRefresh = () => {
    toast.success('Dashboard data refreshed successfully!')
  }

  const handleSelectRange = (range: string) => {
    setDateRange(range)
    setIsDropdownOpen(false)
    toast.success(`Date filter changed to: ${range}`)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-[#0c0836] text-white border-b border-white/5 py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none shrink-0 relative">
      {/* Title and Subtitle */}
      <div>
        <h2 className="text-lg font-bold text-slate-100">Reports & Analytics</h2>
        <p className="text-[11px] text-slate-400 font-medium">Comprehensive collection analytics and MIS reports...</p>
      </div>

      {/* Header Actions & Tools */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Filter Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer transition-all duration-200"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200" />
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-[#0c0836] border border-white/10 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-xs">
              {['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 6 months'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleSelectRange(range)}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors cursor-pointer block ${
                    dateRange === range ? 'text-yellow-400 font-bold bg-white/5' : 'text-slate-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Action */}
        <button
          onClick={handleRefresh}
          className="p-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-white/10 rounded-lg text-slate-200 cursor-pointer transition-all duration-200 active:scale-95"
          title="Refresh Data"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell */}
        <div className="relative p-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-white/10 rounded-lg text-slate-200 cursor-pointer transition-all duration-200">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

        {/* User profile */}
        <UserMenu />
      </div>
    </header>
  )
}
