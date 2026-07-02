// Payment Volume Trend

import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from '@/Components'
import type { PaymentVolumeTrendData } from '../types'
import { CHART_COLORS } from '../constants'

interface PaymentVolumeTrendChartProps {
  data: PaymentVolumeTrendData[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(5, 0, 88, 0.12)',
  borderRadius: '8px',
  color: '#050058',
  fontSize: '11px',
  boxShadow: '0 14px 30px rgba(5, 0, 88, 0.12)',
}

const formatAmount = (value: number | string): string => `₹ ${Number(value).toLocaleString('en-IN')}`

/** Renders the payment trend card with volume, amount, and monthly status data. */
export const PaymentVolumeTrendChart: React.FC<PaymentVolumeTrendChartProps> = ({ data }) => {
  const summary = data.reduce(
    (acc, entry) => {
      acc.volume += entry.volume
      acc.amount += entry.amount
      acc.success += entry.success
      acc.failed += entry.failed
      acc.pending += entry.pending
      return acc
    },
    { volume: 0, amount: 0, success: 0, failed: 0, pending: 0 },
  )

  const averageTicket = summary.volume > 0 ? summary.amount / summary.volume : 0

  return (
    <ChartCard
      title="Payment Volume Trend"
      subtitle="Monthly payment volume with amount and status split"
      className="h-full"
      data={data}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[
            { label: 'Total Volume', value: summary.volume.toLocaleString('en-IN') },
            { label: 'Total Amount', value: formatAmount(summary.amount) },
            { label: 'Avg Ticket', value: formatAmount(averageTicket) },
            // { label: 'Months', value: data.length.toString() },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">{item.label}</div>
              <div className="mt-1 text-sm font-extrabold text-[var(--color-navy)]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 18, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9EAF5" vertical={false} />
              <XAxis dataKey="month" stroke="#5f6f88" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" stroke="#5f6f88" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={42} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#5f6f88" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={56} tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [name === 'Amount' ? formatAmount(value as number) : value, name as string]} />
              <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11, color: '#5f6f88' }} />
              <Bar yAxisId="left" dataKey="volume" name="Volume" fill={CHART_COLORS.gold} radius={[6, 6, 0, 0]} barSize={16} />
              <Line yAxisId="right" type="monotone" dataKey="amount" name="Amount" stroke={CHART_COLORS.navy} strokeWidth={2.5} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="success" name="Success" stroke={CHART_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-xl border border-[rgba(5,0,88,0.08)] bg-white">
          <div className="grid grid-cols-5 gap-2 border-b border-[rgba(5,0,88,0.06)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
            <span>Month</span>
            <span>Volume</span>
            <span>Amount</span>
            <span>Success</span>
            <span>Pending</span>
          </div>
          {data.slice(-4).map((entry) => (
            <div key={entry.month} className="grid grid-cols-5 gap-2 px-3 py-2 text-[12px] text-[var(--color-navy)] odd:bg-[var(--color-ice)]/30">
              <span className="font-semibold">{entry.month}</span>
              <span>{entry.volume.toLocaleString('en-IN')}</span>
              <span>{formatAmount(entry.amount)}</span>
              <span>{formatAmount(entry.success)}</span>
              <span>{formatAmount(entry.pending)}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}

export default PaymentVolumeTrendChart