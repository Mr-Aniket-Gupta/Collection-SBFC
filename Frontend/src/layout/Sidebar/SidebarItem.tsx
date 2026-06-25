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
            ? 'bg-indigo-600/30 text-indigo-200 shadow-sm border-l-2 border-indigo-400 pl-3.5'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`
      }
    >
      <Icon className="w-4.5 h-4.5 shrink-0 transition-transform duration-200" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
