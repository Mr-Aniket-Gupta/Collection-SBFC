import React from 'react'

interface CategoryCardProps {
  id: string
  label: string
  reportsCount: number
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  borderColor: string
  isSelected: boolean
  onClick: () => void
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  label,
  reportsCount,
  icon: Icon,
  bgColor,
  iconColor,
  borderColor,
  isSelected,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-start p-4 rounded-xl border bg-white cursor-pointer select-none transition-all duration-300 relative overflow-hidden ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/10 shadow-md scale-[1.02]'
          : `${borderColor} hover:border-slate-300 hover:shadow-md hover:scale-[1.01]`
      }`}
    >
      {/* Icon with circular tint backdrop */}
      <div className={`p-2.5 rounded-lg mb-3 ${bgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      {/* Label and Count */}
      <div className="space-y-0.5">
        <h4 className="text-[12.5px] font-bold text-slate-800 leading-tight">
          {label}
        </h4>
        <p className="text-[10px] text-slate-400 font-semibold">
          {reportsCount} reports
        </p>
      </div>

      {/* Top right indicator if selected */}
      {isSelected && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
      )}
    </div>
  )
}
export default CategoryCard
