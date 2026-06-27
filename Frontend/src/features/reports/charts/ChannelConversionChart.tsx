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
import { ChartCard } from '@/Components'
import { ChannelConversionData } from '../types'
import { CHART_COLORS } from '../constants'

interface ChannelConversionChartProps {
  data: ChannelConversionData[]
}

export const ChannelConversionChart: React.FC<ChannelConversionChartProps> = ({ data }) => {
  return (
    <ChartCard
      title="Channel Conversion Rate"
      subtitle="Sent > Responded > Converted per channel"
      className="h-80"
      headerAction={
        <div className="text-[10px] font-semibold text-[var(--color-gold)] bg-[rgba(206,155,1,0.12)] px-2 py-1 rounded-md border border-[rgba(206,155,1,0.2)]">
          Conversion Log
        </div>
      }
    >
      <div className="w-full h-[230px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
            barGap={2}
            barSize={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" horizontal={false} />
            <XAxis
              type="number"
              stroke="#5f6f88"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
            />
            <YAxis
              type="category"
              dataKey="channel"
              stroke="#5f6f88"
              tickLine={false}
              axisLine={false}
              width={75}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(5, 0, 88, 0.12)',
                borderRadius: '8px',
                color: '#050058',
                fontSize: '11px',
                boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)'
              }}
              cursor={{ fill: '#D9EAF5' }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', color: '#5f6f88' }}
            />
            <Bar dataKey="sent" name="Sent" fill={CHART_COLORS.navy} radius={[0, 4, 4, 0]} />
            <Bar dataKey="responded" name="Responded" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
            <Bar dataKey="converted" name="Converted" fill={CHART_COLORS.gold} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
