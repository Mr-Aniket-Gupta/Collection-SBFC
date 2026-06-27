import React from 'react'
import { CategoryCard } from './CategoryCard'
import { REPORT_CATEGORIES_CONFIG } from '@/features/reports/constants'

interface CategorySelectorProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const handleCardClick = (id: string) => {
    // Toggle: if click already selected, reset to 'All'
    if (selectedCategory === id) {
      onSelectCategory('All')
    } else {
      onSelectCategory(id)
    }
  }

  return (
    <div className="space-y-3 select-none">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-navy)]">Report Categories</h3>
        <p className="text-[11px] text-[var(--color-ink-muted)] font-medium">Click a card to filter dashboards & table</p>
      </div>

      {/* Grid of category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {REPORT_CATEGORIES_CONFIG.map((cat) => (
          <CategoryCard
            key={cat.id}
            id={cat.id}
            label={cat.label}
            reportsCount={cat.reportsCount}
            icon={cat.icon}
            bgColor={cat.bgColor}
            iconColor={cat.iconColor}
            borderColor={cat.borderColor}
            isSelected={selectedCategory === cat.id}
            onClick={() => handleCardClick(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default CategorySelector
