import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'
import { ChartCard } from '@/Components'
import { RecoveryDistributionData } from '../types'
import { RECOVERY_PIE_COLORS } from '../constants'

interface RecoveryDistributionChartProps {
  data: RecoveryDistributionData[]
}

export const RecoveryDistributionChart: React.FC<RecoveryDistributionChartProps> = ({ data }) => {
  return (
    <ChartCard
      title="Recovery Distribution"
      subtitle="Share of recovery by channel"
      className="h-80"
      headerAction={
        <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.2)]">
          Recovery Split
        </div>
      }
    >
      <div className="w-full h-[230px] text-[10px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(5, 0, 88, 0.12)',
                borderRadius: '8px',
                color: '#050058',
                fontSize: '11px',
                boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)'
              }}
              formatter={(value) => [`${value}%`]}
            />
            <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={RECOVERY_PIE_COLORS[index % RECOVERY_PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', color: '#5f6f88' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export default RecoveryDistributionChart
