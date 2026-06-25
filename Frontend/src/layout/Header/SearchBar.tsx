import React from 'react'
import { Search } from 'lucide-react'

export const SearchBar: React.FC = () => {
  return (
    <div className="relative w-72">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="text"
        placeholder="Search reports, cases, users..."
        className="block w-full pl-9 pr-4 py-1.5 bg-indigo-950/40 text-slate-200 text-xs border border-white/10 rounded-lg placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
      />
    </div>
  )
}
