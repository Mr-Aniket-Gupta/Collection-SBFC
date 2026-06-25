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
  History,
  Settings,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'

export const Sidebar: React.FC = () => {
  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cases', label: 'Case Management', icon: Briefcase },
    { to: '/strategy', label: 'Strategy Builder', icon: GitBranch },
    { to: '/approvals', label: 'Approvals', icon: ClipboardCheck },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/users', label: 'User Management', icon: Users },
    { to: '/masters', label: 'Masters Config', icon: Database },
    { to: '/communication', label: 'Communication Config', icon: MessageSquare },
    { to: '/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/system-config', label: 'System Config', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-[#0c0836] text-white flex flex-col h-screen border-r border-white/5 shrink-0 select-none">
      {/* Logo Section */}
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className="bg-indigo-600/30 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-100">CollectIQ</h1>
          <p className="text-[10px] text-indigo-400 font-semibold tracking-wide">Digital Collections</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-thin">
        {menuItems.map((item) => (
          <SidebarItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-yellow-500 text-slate-905 flex items-center justify-center font-bold text-xs shrink-0 text-[#0c0836]">
            AM
          </div>
          <div className="overflow-hidden">
            <h4 className="text-[12px] font-semibold text-slate-200 truncate">Aarav Mehta</h4>
            <p className="text-[10px] text-slate-400 truncate">Administrator</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-200 cursor-pointer p-1 rounded hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
