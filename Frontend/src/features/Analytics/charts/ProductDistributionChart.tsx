// Renders a pie chart displaying the distribution of products or channels.

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { ProductDistribution } from '../types/analytics.types'
import { formatCappedPercent } from '@/features/reports/utils/formatters'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-[rgba(5,0,88,0.12)] rounded-xl px-4 py-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
          <p className="text-[12px] font-semibold text-[var(--color-navy)]">{payload[0].name}</p>
        </div>
        <p className="text-[18px] font-bold text-[var(--color-navy)]">{formatCappedPercent(Number(payload[0].value))}</p>
      </div>
    )
  }
  return null
}

interface ProductDistributionChartProps {
  data: ProductDistribution[]
  title?: string
  subtitle?: string
}

export const ProductDistributionChart: React.FC<ProductDistributionChartProps> = ({
  data,
  title = 'Product-wise Distribution',
  subtitle = 'Collection portfolio breakdown by product type',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const palette =
    title === 'Recovery Efficiency'
      ? ['#3A7D44', '#5AA469', '#8B5CF6', '#7C3AED', '#0B3C5D']
      : title === 'Portfolio Risk Distribution'
        ? ['#0B3C5D', '#2E86AB', '#CE9B01', '#F3B61F', '#9E2A2B']
        : ['#000182', '#CE9B01', '#050058', '#7C8CA6', '#2E86AB']

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      data={data}
    >
      <div className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative w-full" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
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
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={palette[data.indexOf(entry) % palette.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[28px] font-bold text-[var(--color-navy)]">{formatCappedPercent(total)}</p>
            <p className="text-[11px] text-[var(--color-ink-muted)] font-medium">Total</p>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full mt-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: palette[data.indexOf(item) % palette.length] }}
              />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-[12px] text-[var(--color-ink-muted)] font-medium truncate">{item.name}</span>
                <span className="text-[12px] font-bold text-[var(--color-navy)] ml-1">{formatCappedPercent(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
