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
import { ChartCard } from '@/Components'
import { BucketWiseTrendData } from '../types'
import { BUCKET_CHART_COLORS } from '../constants'

interface BucketWiseTrendChartProps {
  data: BucketWiseTrendData[]
}

export const BucketWiseTrendChart: React.FC<BucketWiseTrendChartProps> = ({ data }) => {
  return (
    <ChartCard
      title="Bucket-wise Trend"
      subtitle="DPD movement over the last 6 months"
      className="h-80"
      headerAction={
        <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.2)]">
          DPD Flow
        </div>
      }
    >
      <div className="w-full h-[230px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {BUCKET_CHART_COLORS.map((color, idx) => (
                <linearGradient key={color} id={`colorDpd_${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
            <XAxis dataKey="month" stroke="#5f6f88" tickLine={false} axisLine={false} tickMargin={6} />
            <YAxis stroke="#5f6f88" tickLine={false} axisLine={false} tickMargin={8} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(5, 0, 88, 0.12)',
                borderRadius: '8px',
                color: '#050058',
                fontSize: '11px',
                boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', color: '#5f6f88' }}
            />
            <Area type="monotone" dataKey="0-30 DPD" stackId="1" stroke={BUCKET_CHART_COLORS[0]} fill="url(#colorDpd_0)" />
            <Area type="monotone" dataKey="31-60 DPD" stackId="1" stroke={BUCKET_CHART_COLORS[1]} fill="url(#colorDpd_1)" />
            <Area type="monotone" dataKey="61-90 DPD" stackId="1" stroke={BUCKET_CHART_COLORS[2]} fill="url(#colorDpd_2)" />
            <Area type="monotone" dataKey="91-120 DPD" stackId="1" stroke={BUCKET_CHART_COLORS[3]} fill="url(#colorDpd_3)" />
            <Area type="monotone" dataKey="120+ DPD" stackId="1" stroke={BUCKET_CHART_COLORS[4]} fill="url(#colorDpd_4)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export default BucketWiseTrendChart
