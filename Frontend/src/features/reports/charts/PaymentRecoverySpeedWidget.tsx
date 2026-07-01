import React, { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { ChartCard } from '@/Components'
import type { DateRangeOption, DcspTableRow } from '../types'
import type { ReportTableBundle } from '../utils/reportFilterEngine'
import {
  computePaymentRecoverySpeedWithPrev,
  formatAvgDays,
} from '../utils/paymentRecoverySpeed'


interface PaymentRecoverySpeedWidgetProps {
  bundle: Pick<ReportTableBundle, 'cases' | 'payments'>
  dateRange: DateRangeOption
  customFromDate?: string
  customToDate?: string
}

export const PaymentRecoverySpeedWidget: React.FC<PaymentRecoverySpeedWidgetProps> = ({
  bundle,
  dateRange,
  customFromDate,
  customToDate,
}) => {
  const metrics = useMemo(
    () => computePaymentRecoverySpeedWithPrev(bundle, dateRange, customFromDate, customToDate),
    [bundle, dateRange, customFromDate, customToDate],
  )

  const { current, previous } = metrics

  const diffDays =
    current.avgDays != null && previous.avgDays != null ? current.avgDays - previous.avgDays : null

  const improvement = diffDays != null
    ? diffDays < 0
    : null

  const diffLabel = diffDays == null
    ? '—'
    : `${Math.abs(Math.round(diffDays * 10) / 10)} days ${diffDays < 0 ? 'faster' : 'slower'}`

  return (
    <ChartCard
      title="Payment Recovery Speed"
      subtitle="Average recovery time (successful payment - case creation)"
      className="h-[340px]"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-[rgba(206,155,1,0.12)] p-2">
                <Wallet className="h-4 w-4 text-[var(--color-gold)]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">Current</span>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--color-navy)]">{formatAvgDays(current.avgDays)}</div>
            <div className="mt-2 text-[12px] text-[var(--color-ink-muted)]">
              Successful recoveries: {current.recoveryCount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-[rgba(5,0,88,0.06)] p-2">
                {improvement ? (
                  <ArrowUpRight className="h-4 w-4 text-green-700" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-700" />
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">Previous</span>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--color-navy)]">{formatAvgDays(previous.avgDays)}</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
              <span className={improvement ? 'text-green-700' : 'text-red-700'}>{diffLabel}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] border border-[rgba(5,0,88,0.08)] p-4 text-[12px] text-[var(--color-ink-muted)]">
          <div className="font-bold text-[var(--color-navy)]">Formula</div>
          <div className="mt-2">
            Average Days = Payment Date (successful) − Case Creation Date
          </div>
        </div>
      </div>
    </ChartCard>
  )
}

export default PaymentRecoverySpeedWidget

