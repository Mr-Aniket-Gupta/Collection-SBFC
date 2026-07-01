import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { ChartCard } from '@/Components'
import type { RecoveryDistributionData } from '../types'
import { RECOVERY_PIE_COLORS } from '../constants'

interface RecoveryDistributionChartProps {
  data: RecoveryDistributionData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

/** Recovery Distribution pie chart — share of recovery by channel. */
export const RecoveryDistributionChart: React.FC<RecoveryDistributionChartProps> = ({ data }) => (
  <ChartCard
    title="Recovery Distribution"
    subtitle="Share of recovery by channel"
    className="h-[340px]"
    data={data}
  >
    <div className="flex h-[250px] w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}%`]} />
          <Pie
            data={data}
            cx="50%"
            cy="42%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={RECOVERY_PIE_COLORS[index % RECOVERY_PIE_COLORS.length]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={40}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: 10, color: '#5f6f88', lineHeight: '16px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
)

export default RecoveryDistributionChart
