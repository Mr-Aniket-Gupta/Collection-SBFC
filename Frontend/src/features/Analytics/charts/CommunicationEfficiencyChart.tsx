import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { HourlyCallData } from '../types/analytics.types'

interface CommunicationEfficiencyChartProps {
  data: HourlyCallData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

export const CommunicationEfficiencyChart: React.FC<CommunicationEfficiencyChartProps> = ({ data }) => {
  const chartData = data.map((row) => ({
    hour: row.hour,
    deliveryRate: row.calls ? Number(((row.responses / row.calls) * 100).toFixed(1)) : 0,
    delivered: row.responses,
    sent: row.calls,
  }))

  return (
    <ChartCard
      title="Communication Efficiency"
      subtitle="Delivered vs total communication volume by hour"
      data={chartData}
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend verticalAlign="bottom" height={30} />
            <Line type="monotone" dataKey="sent" name="Sent" stroke="#000182" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="delivered" name="Delivered" stroke="#CE9B01" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="deliveryRate" name="Delivery %" stroke="#050058" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export default CommunicationEfficiencyChart
