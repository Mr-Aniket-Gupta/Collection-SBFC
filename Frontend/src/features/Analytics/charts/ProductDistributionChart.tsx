// ─── Product-wise Distribution Donut Chart ───────────────────────────────────

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { productDistribution } from '../data/analytics.data'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
          <p className="text-[12px] font-semibold text-[#00044A]">{payload[0].name}</p>
        </div>
        <p className="text-[18px] font-bold text-[#00044A]">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export const ProductDistributionChart: React.FC = () => {
  const total = productDistribution.reduce((sum, item) => sum + item.value, 0)

  return (
    <ChartCard
      title="Product-wise Distribution"
      subtitle="Collection portfolio breakdown by product type"
    >
      <div className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative w-full" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={productDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={900}
                animationEasing="ease-out"
                startAngle={90}
                endAngle={-270}
              >
                {productDistribution.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[28px] font-bold text-[#00044A]">{total}%</p>
            <p className="text-[11px] text-slate-400 font-medium">Total</p>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full mt-3">
          {productDistribution.map((item) => (
            <div key={item.name} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-[12px] text-slate-600 font-medium truncate">{item.name}</span>
                <span className="text-[12px] font-bold text-[#00044A] ml-1">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
