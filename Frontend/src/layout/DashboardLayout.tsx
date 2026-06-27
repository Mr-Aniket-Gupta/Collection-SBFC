// Dashboard Layout

import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-ice)] text-[var(--color-navy)] font-sans">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        {/* Top Navbar */}
        <Header />

        {/* Scrollable Content Area */}
        <main className="flex-grow overflow-y-auto bg-[linear-gradient(180deg,#FFFFFF_0%,#D9EAF5_100%)] p-6 scrollbar-thin" role="main">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
