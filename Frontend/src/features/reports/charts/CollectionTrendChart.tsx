import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { CollectionTrendData } from '../types'
import { CHART_COLORS } from '../constants'

interface CollectionTrendChartProps {
  data: CollectionTrendData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

const formatAmount = (value: number | string): string =>
  `₹ ${Number(value).toLocaleString('en-IN')}`

/** Collection Trend chart — monthly payment amounts by status. */
export const CollectionTrendChart: React.FC<CollectionTrendChartProps> = ({ data }) => (
  <ChartCard
    title="Collection Trend"
    subtitle="Payment amounts by status (Success, Failed, Pending)"
    className="h-[340px]"
    data={data}
  >
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#5f6f88"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#5f6f88" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={48} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatAmount(value as number)]} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ paddingTop: 12, fontSize: 11, color: '#5f6f88' }}
          />
          <Line
            type="monotone"
            dataKey="success"
            name="Success"
            stroke={CHART_COLORS.navy}
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="failed"
            name="Failed"
            stroke="#E74C3C"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="pending"
            name="Pending"
            stroke={CHART_COLORS.gold}
            strokeDasharray="4 4"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
)

export default CollectionTrendChart
