// ─── PerformanceRadar Chart Section ──────────────────────────────────────────

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
import { ChartCard } from '../components/ChartCard'
import { radarData } from '../data/analytics.data'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { metric: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg">
        <p className="text-[11px] text-slate-500 font-medium">{payload[0].payload.metric}</p>
        <p className="text-[16px] font-bold text-[#00044A]">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export const PerformanceRadar: React.FC = () => {
  return (
    <ChartCard
      title="Performance Radar"
      subtitle="Collection team performance across key metrics"
    >
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="#E5E7EB"
            strokeDasharray="4 2"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{
              fontSize: 11,
              fill: '#64748B',
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#94A3B8' }}
            axisLine={false}
          />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#38BDF8"
            fill="#38BDF8"
            fillOpacity={0.25}
            strokeWidth={2.5}
            dot={{ fill: '#38BDF8', r: 4, strokeWidth: 0 }}
            animationBegin={100}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Metric Legend Pills */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {radarData.map((item) => (
          <div
            key={item.metric}
            className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 rounded-full"
          >
            <span className="text-[10px] font-semibold text-sky-700">{item.metric}</span>
            <span className="text-[10px] font-bold text-[#00044A]">{item.value}%</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
