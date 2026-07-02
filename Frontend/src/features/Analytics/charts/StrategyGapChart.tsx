import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { StrategyRow } from '../types/analytics.types'

interface StrategyGapChartProps {
  data: StrategyRow[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

export const StrategyGapChart: React.FC<StrategyGapChartProps> = ({ data }) => {
  const chartData = [...data]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6)
    .map((row) => ({
      name: row.name,
      achieved: row.percentage,
      target: row.target,
      gap: Math.max(row.target - row.percentage, 0),
      color: row.color,
    }))

  return (
    <ChartCard
      title="Strategy vs Target Gap"
      subtitle="Closed-case performance against DPD target by strategy"
      data={chartData}
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-18} textAnchor="end" height={52} interval={0} />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="achieved" name="Achieved" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="target" name="Target" fill="#D9EAF5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export default StrategyGapChart
