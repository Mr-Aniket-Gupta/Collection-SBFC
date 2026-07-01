// Renders a bar chart showing the distribution of calls over different hours.

import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { HourlyCallData } from '../types/analytics.types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-[rgba(5,0,88,0.12)] rounded-xl px-4 py-3 shadow-xl">
        <p className="text-[12px] font-bold text-[var(--color-navy)] mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-[12px] text-[var(--color-ink-muted)]">{entry.name}</span>
            </div>
            <span className="text-[12px] font-bold text-[var(--color-navy)]">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBar = (props: any) => {
  const { x, y, width, height, fill } = props
  const radius = 5
  return (
    <path
      d={`M${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} L${x},${y + height} Z`}
      fill={fill}
    />
  )
}

interface HourlyCallDistributionProps {
  data: HourlyCallData[]
}

export const HourlyCallDistribution: React.FC<HourlyCallDistributionProps> = ({ data }) => {
  return (
    <ChartCard
      title="Hourly Call Distribution"
      subtitle="Calls made vs. responses received throughout the day"
      data={data}
    >
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="#D9EAF5"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{
              fontSize: 12,
              fill: '#5f6f88',
              fontWeight: 500,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: '#5f6f88',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: '#D9EAF5', radius: 8 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              paddingBottom: '12px',
            }}
          />
          <Bar
            dataKey="calls"
            name="Calls Made"
            fill="#000182"
            shape={<CustomBar />}
            maxBarSize={32}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            dataKey="responses"
            name="Responses"
            stroke="#CE9B01"
            strokeWidth={2.5}
            dot={{ fill: '#CE9B01', r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, stroke: '#CE9B01', strokeWidth: 2 }}
            type="monotone"
            animationBegin={400}
            animationDuration={900}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
