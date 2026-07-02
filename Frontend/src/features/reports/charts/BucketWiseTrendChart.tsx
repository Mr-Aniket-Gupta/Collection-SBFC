// Bucket-wise Trend
// Strategy buckets: 0-30, 31-60, 61-90, 90+


import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { BucketWiseTrendData } from '../types'
import { BUCKET_CHART_COLORS } from '../constants'

interface BucketWiseTrendChartProps {
  data: BucketWiseTrendData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

const BUCKET_KEYS = ['0-30', '31-60', '61-90', '90+'] as const

/** Bucket-wise Trend chart — strategy buckets 0-30, 31-60, 61-90, 90+ over time. */
export const BucketWiseTrendChart: React.FC<BucketWiseTrendChartProps> = ({ data }) => (
  <ChartCard
    title="Bucket-wise Trend"
    subtitle="Strategy buckets: 0-30, 31-60, 61-90, 90+"
    className="h-[340px]"
    data={data}
  >
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#5f6f88"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#5f6f88" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ paddingTop: 12, fontSize: 10, color: '#5f6f88' }}
          />
          {BUCKET_KEYS.map((bucket, index) => (
            <Area
              key={bucket}
              type="monotone"
              dataKey={bucket}
              name={bucket}
              stackId="1"
              stroke={BUCKET_CHART_COLORS[index % BUCKET_CHART_COLORS.length]}
              fill={BUCKET_CHART_COLORS[index % BUCKET_CHART_COLORS.length]}
              fillOpacity={0.4}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
)

export default BucketWiseTrendChart
