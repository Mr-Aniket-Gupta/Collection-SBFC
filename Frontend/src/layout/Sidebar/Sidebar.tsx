// Sidebar Component

import React from 'react'
import {
  LayoutDashboard,
  Briefcase,
  GitBranch,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  Users,
  Database,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases', label: 'Case Management', icon: Briefcase },
  { to: '/strategy', label: 'Strategy Builder', icon: GitBranch },
  { to: '/approvals', label: 'Approvals', icon: ClipboardCheck },
  { to: '/reports/cases', label: 'Reports', icon: BarChart3 },
  { to: '/analytics/dashboard', label: 'Analytics', icon: TrendingUp },
  { to: '/users', label: 'User Management', icon: Users },
  { to: '/masters', label: 'Masters Config', icon: Database },
  { to: '/communication', label: 'Communication Config', icon: MessageSquare },
]

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="w-64 bg-[var(--color-navy)] text-white flex flex-col h-screen border-r border-white/10 shrink-0 select-none"
      aria-label="Main navigation"
    >
      {/* Logo Section */}
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg border border-white/10">
          <ShieldCheck className="w-5 h-5 text-[var(--color-gold)]" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-100">CollectIQ</h1>
          <p className="text-[10px] text-[var(--color-gold)] font-semibold tracking-wide">
            Digital Collections
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-thin">
        {menuItems.map((item) => (
          <SidebarItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </nav>

    </aside>
  )
}
