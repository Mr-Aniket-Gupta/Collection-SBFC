// ─── Sidebar Component ────────────────────────────────────────────────────────

import React, { useState } from 'react'
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
  ChevronLeft,
  ShieldCheck,
  LogOut,
  Settings,
  UserCircle,
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'

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
]

export const Sidebar: React.FC = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <aside
      className="w-64 bg-[#0c0836] text-white flex flex-col h-screen border-r border-white/5 shrink-0 select-none"
      aria-label="Main navigation"
    >
      {/* ── Logo Section ─────────────────────────────────────────── */}
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className="bg-indigo-600/30 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-100">CollectIQ</h1>
          <p className="text-[10px] text-indigo-400 font-semibold tracking-wide">
            Digital Collections
          </p>
        </div>
      </div>

      {/* ── Navigation List ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-thin">
        {menuItems.map((item) => (
          <SidebarItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* ── User Footer ───────────────────────────────────────────── */}
      <div className="border-t border-white/5 relative">
        <button
          id="sidebar-user-menu-btn"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className="w-full p-4 bg-black/20 flex items-center justify-between gap-3 hover:bg-black/30 transition-colors duration-200 cursor-pointer"
          aria-haspopup="true"
          aria-expanded={userMenuOpen}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-xs shrink-0 text-[#0c0836]">
              RK
            </div>
            <div className="overflow-hidden">
              <h4 className="text-[12px] font-semibold text-slate-200 truncate">Rajesh Kumar</h4>
              <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
          <ChevronLeft
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              userMenuOpen ? '-rotate-90' : ''
            }`}
          />
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#12103d] border border-white/10 rounded-xl py-1.5 shadow-2xl z-50 overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <UserCircle className="w-4 h-4" />
              View Profile
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <div className="my-1.5 border-t border-white/5" />
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
