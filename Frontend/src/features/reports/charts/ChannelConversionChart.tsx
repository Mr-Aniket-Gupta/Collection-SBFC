import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { ChannelConversionData } from '../types'
import { CHART_COLORS } from '../constants'

interface ChannelConversionChartProps {
  data: ChannelConversionData[]
}

export const ChannelConversionChart: React.FC<ChannelConversionChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80 bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Channel Conversion Rate</h3>
          <p className="text-[10px] text-slate-400 font-medium">Sent → Responded → Converted per channel</p>
        </div>
        <div className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          Conversion Log
        </div>
      </div>

      <div className="w-full h-[230px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
            barGap={2}
            barSize={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
            />
            <YAxis
              type="category"
              dataKey="channel"
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              width={75}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', color: '#64748b' }}
            />
            <Bar
              dataKey="sent"
              name="Sent"
              fill={CHART_COLORS.indigo}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="responded"
              name="Responded"
              fill={CHART_COLORS.amber}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="converted"
              name="Converted"
              fill={CHART_COLORS.yellowLight}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
