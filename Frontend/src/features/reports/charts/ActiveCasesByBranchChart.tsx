// Active Cases by Branch chart in report page 


import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { TrendSeriesData } from '../types'

interface ActiveCasesByBranchChartProps {
  data: TrendSeriesData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

/** Renders the active-case branch chart inside the shared report card shell. */
export const ActiveCasesByBranchChart: React.FC<ActiveCasesByBranchChartProps> = ({ data }) => {
  const topBranch = data[0]

  return (
    <ChartCard
      title="Active Cases by Branch"
      subtitle="Open cases grouped by branch from Recovery MIS"
      className="h-full"
      data={data}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Branches', value: data.length.toString() },
            { label: 'Top Branch', value: topBranch ? topBranch.label : 'N/A' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">{item.label}</div>
              <div className="mt-1 text-sm font-extrabold text-[var(--color-navy)]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9EAF5" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} interval={0} />
              <YAxis tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#CE9B01" radius={[6, 6, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartCard>
  )
}

export default ActiveCasesByBranchChart