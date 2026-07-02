import React from 'react'
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Line } from 'recharts'
import { ChartCard } from '@/Components'

interface BranchContributionChartProps {
  data: Array<{ name: string; value: number; target: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

export const BranchContributionChart: React.FC<BranchContributionChartProps> = ({ data }) => (
  <ChartCard title="Top Branch Contributors" subtitle="Branches driving the outstanding book in the filtered view" data={data}>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D9EAF5" />
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [Number(value).toLocaleString('en-IN'), name]} />
          <Bar dataKey="value" name="Outstanding" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={['#0B3C5D', '#2E86AB', '#CE9B01', '#F3B61F', '#9E2A2B'][index % 5]} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="target" stroke="#7C8CA6" strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
)

export default BranchContributionChart
