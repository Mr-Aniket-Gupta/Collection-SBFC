import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { FunnelStageData } from '../types'

interface CommunicationFunnelChartProps {
  data: FunnelStageData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

/** Renders the communication funnel inside the shared report card shell. */
export const CommunicationFunnelChart: React.FC<CommunicationFunnelChartProps> = ({ data }) => {
  const converted = data.find((entry) => entry.stage === 'Converted')

  return (
    <ChartCard
      title="Communication Chart"
      subtitle="Sent → Delivered → Read → Responded → Converted from Communications table"
      className="h-full"
      data={data}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Stages', value: data.length.toString() },
            { label: 'Converted', value: converted ? `${converted.count} (${converted.percent}%)` : '0' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">{item.label}</div>
              <div className="mt-1 text-sm font-extrabold text-[var(--color-navy)]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D9EAF5" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, _name, item) => [`${value} (${item.payload.percent}%)`, 'Count']} />
              <Bar dataKey="count" fill="#050058" radius={[0, 6, 6, 0]} name="Count">
                <LabelList dataKey="count" position="right" fill="#050058" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartCard>
  )
}

export default CommunicationFunnelChart