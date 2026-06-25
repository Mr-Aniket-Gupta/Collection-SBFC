import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'
import { RecoveryDistributionData } from '../types'
import { RECOVERY_PIE_COLORS } from '../constants'

interface RecoveryDistributionChartProps {
  data: RecoveryDistributionData[]
}

export const RecoveryDistributionChart: React.FC<RecoveryDistributionChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recovery Distribution</h3>
          <p className="text-[10px] text-slate-400 font-medium">Share of recovery by channel</p>
        </div>
        <div className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700/50">
          Recovery Split
        </div>
      </div>

      <div className="w-full h-[230px] text-[10px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c0836',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              formatter={(value) => [`${value}%`]}
            />
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RECOVERY_PIE_COLORS[index % RECOVERY_PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', color: '#64748b' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default RecoveryDistributionChart
