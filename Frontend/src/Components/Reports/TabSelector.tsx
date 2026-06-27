import React from 'react'

interface TabSelectorProps {
  activeTab: string
  onChangeTab: (tab: string) => void
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onChangeTab }) => {
  const tabs = ['Overview', 'Detailed Reports', 'Trends', 'Funnel Analysis']

  return (
    <div className="flex bg-[var(--color-ice)] p-1 rounded-lg select-none w-fit border border-[rgba(5,0,88,0.08)]">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onChangeTab(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'bg-white text-[var(--color-navy)] shadow-sm border border-[rgba(5,0,88,0.1)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-navy)]'
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
