import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { BucketWiseTrendData } from '../types'
import { BUCKET_CHART_COLORS } from '../constants'

interface BucketWiseTrendChartProps {
  data: BucketWiseTrendData[]
}

export const BucketWiseTrendChart: React.FC<BucketWiseTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Bucket-wise Trend</h3>
          <p className="text-[10px] text-slate-400 font-medium">DPD movement over the last 6 months</p>
        </div>
        <div className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700/50">
          DPD Flow
        </div>
      </div>

      <div className="w-full h-[230px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              {BUCKET_CHART_COLORS.map((color, idx) => (
                <linearGradient key={color} id={`colorDpd_${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
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
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', color: '#64748b' }}
            />
            <Area
              type="monotone"
              dataKey="0-30 DPD"
              stackId="1"
              stroke={BUCKET_CHART_COLORS[0]}
              fill={`url(#colorDpd_0)`}
            />
            <Area
              type="monotone"
              dataKey="31-60 DPD"
              stackId="1"
              stroke={BUCKET_CHART_COLORS[1]}
              fill={`url(#colorDpd_1)`}
            />
            <Area
              type="monotone"
              dataKey="61-90 DPD"
              stackId="1"
              stroke={BUCKET_CHART_COLORS[2]}
              fill={`url(#colorDpd_2)`}
            />
            <Area
              type="monotone"
              dataKey="91-120 DPD"
              stackId="1"
              stroke={BUCKET_CHART_COLORS[3]}
              fill={`url(#colorDpd_3)`}
            />
            <Area
              type="monotone"
              dataKey="120+ DPD"
              stackId="1"
              stroke={BUCKET_CHART_COLORS[4]}
              fill={`url(#colorDpd_4)`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default BucketWiseTrendChart
