// PerformanceRadar Chart Section

import React from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { RadarDataPoint } from '../types/analytics.types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { metric: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-[rgba(5,0,88,0.12)] rounded-xl px-3 py-2.5 shadow-lg">
        <p className="text-[11px] text-[var(--color-ink-muted)] font-medium">{payload[0].payload.metric}</p>
        <p className="text-[16px] font-bold text-[var(--color-navy)]">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

interface PerformanceRadarProps {
  data: RadarDataPoint[]
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ data }) => {
  return (
    <ChartCard
      title="Performance Radar"
      subtitle="Collection team performance across key metrics"
      data={data}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="#D9EAF5"
            strokeDasharray="4 2"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{
              fontSize: 11,
              fill: '#5f6f88',
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#5f6f88' }}
            axisLine={false}
          />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#000182"
            fill="#000182"
            fillOpacity={0.25}
            strokeWidth={2.5}
            dot={{ fill: '#CE9B01', r: 4, strokeWidth: 0 }}
            animationBegin={100}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Metric Legend Pills */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {data.map((item) => (
          <div
            key={item.metric}
            className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-ice)] rounded-full"
          >
            <span className="text-[10px] font-semibold text-[var(--color-blue)]">{item.metric}</span>
            <span className="text-[10px] font-bold text-[var(--color-navy)]">{item.value}%</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
