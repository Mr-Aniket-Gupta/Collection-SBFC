import React from 'react'
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, Line } from 'recharts'
import { ChartCard } from '@/Components'

interface AgentContributionChartProps {
  data: Array<{ agentName: string; allocatedCases: number; resolvedCases: number; recoveredAmount: number }>
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

export const AgentContributionChart: React.FC<AgentContributionChartProps> = ({ data }) => (
  <ChartCard title="Top Agent Contributors" subtitle="Allocated, resolved, and recovery mix by agent" data={data}>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 36 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
          <XAxis dataKey="agentName" tick={{ fontSize: 10 }} angle={-18} textAnchor="end" height={52} interval={0} />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend verticalAlign="bottom" height={28} />
          <Bar dataKey="allocatedCases" name="Allocated" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.agentName}-allocated`} fill={['#0B3C5D', '#2E86AB', '#CE9B01', '#F3B61F', '#9E2A2B'][index % 5]} />
            ))}
          </Bar>
          <Bar dataKey="resolvedCases" name="Resolved" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.agentName}-resolved`} fill={['#3A7D44', '#5AA469', '#1D4ED8', '#7C3AED', '#D97706'][index % 5]} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="recoveredAmount" name="Recovered Amount" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
)

export default AgentContributionChart
