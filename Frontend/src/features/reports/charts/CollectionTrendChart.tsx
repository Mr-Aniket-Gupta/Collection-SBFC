import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { ChartCard } from '@/Components'
import { CollectionTrendData } from '../types'
import { CHART_COLORS } from '../constants'

interface CollectionTrendChartProps {
  data: CollectionTrendData[]
}

export const CollectionTrendChart: React.FC<CollectionTrendChartProps> = ({ data }) => {
  return (
    <ChartCard
      title="Collection Trend"
      subtitle="Monthly collection vs target (INR Cr)"
      className="h-80"
      headerAction={
        <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.2)]">
          Target Analysis
        </div>
      }
    >
      <div className="w-full h-[230px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
            <XAxis dataKey="month" stroke="#5f6f88" tickLine={false} axisLine={false} tickMargin={6} />
            <YAxis stroke="#5f6f88" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${v}Cr`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(5, 0, 88, 0.12)',
                borderRadius: '8px',
                color: '#050058',
                fontSize: '11px',
                boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)'
              }}
              formatter={(value) => [`INR ${value} Cr`]}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', color: '#5f6f88' }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke={CHART_COLORS.gold}
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="collection"
              name="Collection"
              stroke={CHART_COLORS.blue}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export default CollectionTrendChart
