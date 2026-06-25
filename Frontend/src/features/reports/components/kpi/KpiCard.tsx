import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  trend: number // percentage value, can be positive/negative
  icon: React.ComponentType<{ className?: string }>
  iconBgColor?: string
  iconColor?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  iconBgColor = 'bg-slate-50',
  iconColor = 'text-slate-500'
}) => {
  const isPositive = trend >= 0
  const absoluteTrend = Math.abs(trend)

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
      <div className="space-y-3.5">
        {/* Title */}
        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          {title}
        </h4>

        {/* Value and Trend */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
            {value}
          </h2>
          
          {/* Trend Indicator */}
          <div className="flex items-center gap-1.5 select-none">
            <span
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-2.5 h-2.5 shrink-0" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 shrink-0" />
              )}
              <span>{absoluteTrend}% vs prev</span>
            </span>
          </div>
        </div>
      </div>

      {/* Icon Right Side Box */}
      <div className={`p-3 rounded-lg shrink-0 border border-slate-100/50 ${iconBgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  )
}
export default KpiCard
