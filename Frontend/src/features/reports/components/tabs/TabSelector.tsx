import React from 'react'

interface TabSelectorProps {
  activeTab: string
  onChangeTab: (tab: string) => void
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onChangeTab }) => {
  const tabs = ['Overview', 'Detailed Reports', 'Trends', 'Funnel Analysis']

  return (
    <div className="flex bg-slate-100 p-1 rounded-lg select-none w-fit border border-slate-200/50">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onChangeTab(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}
export default TabSelector
