// Channel Conversion Rate
// SMS, WhatsApp, Email, AI Call & Field visit counts

import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { ChannelConversionData } from '../types'
import { CHART_COLORS } from '../constants'

interface ChannelConversionChartProps {
  data: ChannelConversionData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

const BAR_COLORS = [CHART_COLORS.navy, CHART_COLORS.blue, CHART_COLORS.gold, '#8D6B19', '#5B2C6F']

/** Channel Conversion Rate chart — communication counts by channel. */
export const ChannelConversionChart: React.FC<ChannelConversionChartProps> = ({ data }) => (
  <ChartCard
    title="Channel Conversion Rate"
    subtitle="SMS, WhatsApp, Email, AI Call & Field visit counts"
    className="h-[340px]"
    data={data}
  >
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
          barSize={14}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" horizontal={false} />
          <XAxis type="number" stroke="#5f6f88" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="channel"
            stroke="#5f6f88"
            tickLine={false}
            axisLine={false}
            width={118}
            tick={{ fontSize: 10, fill: '#5f6f88' }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F4F6' }} />
          <Bar dataKey="sent" name="Count" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.channel} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
)
