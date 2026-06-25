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
import { CollectionTrendData } from '../types'
import { CHART_COLORS } from '../constants'

interface CollectionTrendChartProps {
  data: CollectionTrendData[]
}

export const CollectionTrendChart: React.FC<CollectionTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Collection Trend</h3>
          <p className="text-[10px] text-slate-400 font-medium">Monthly collection vs target (₹ Cr)</p>
        </div>
        <div className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700/50">
          Target Analysis
        </div>
      </div>

      <div className="w-full h-[230px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${v}Cr`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c0836',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              formatter={(value) => [`₹${value} Cr`]}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', color: '#64748b' }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke={CHART_COLORS.amber}
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="collection"
              name="Collection"
              stroke={CHART_COLORS.indigoLight}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default CollectionTrendChart
