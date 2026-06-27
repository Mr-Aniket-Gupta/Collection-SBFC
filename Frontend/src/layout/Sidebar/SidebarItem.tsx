// SidebarItem Component

import React from 'react'
import { NavLink } from 'react-router-dom'

interface SidebarItemProps {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ to, label, icon: Icon }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3.5 px-4 py-3 rounded-lg text-[13.5px] font-medium transition-all duration-200 ${
          isActive
            ? 'bg-white/10 text-white shadow-sm border-l-2 border-[var(--color-gold)] pl-3.5'
            : 'text-slate-300 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
