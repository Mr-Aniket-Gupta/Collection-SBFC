import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content viewport */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Dynamic header */}
        <Header />

        {/* Scrollable workspace content */}
        <main className="flex-grow overflow-y-auto bg-slate-50 p-6 scrollbar-thin">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
