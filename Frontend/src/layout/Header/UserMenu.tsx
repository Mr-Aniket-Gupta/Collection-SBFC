import React from 'react'

export const UserMenu: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="text-right hidden sm:block">
        <h4 className="text-xs font-semibold text-slate-200">Aarav Mehta</h4>
        <p className="text-[9px] text-slate-400 font-medium">Administrator</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-yellow-500 text-slate-905 flex items-center justify-center font-bold text-xs shadow-sm border border-yellow-400/20 text-[#0c0836]">
        AM
      </div>
    </div>
  )
}
