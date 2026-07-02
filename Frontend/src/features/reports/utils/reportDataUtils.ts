// This utility centralizes report data processing by fetching all report tables, organizing them into a unified bundle, transforming them into a common report format, and providing grouped data for dashboard components such as charts, filters, and MIS summary cards.

import { reportsService } from '../services/reportsService'
import type { ReportLibraryRow } from '../types'
import type { ReportTableKey } from '../hooks/useReports'
import { makeReportRow } from './reportHelpers'
import {
  EMPTY_BUNDLE,
  REPORT_TABLE_KEYS,
  type ReportTableBundle,
} from './reportFilterEngine'
import { flattenRows, prettyTitle } from './tableUtils'

export async function fetchReportTableBundle(limit: number): Promise<ReportTableBundle> {
  const bundle = EMPTY_BUNDLE()

  await Promise.all(
    REPORT_TABLE_KEYS.map(async (tableKey) => {
      const res = await reportsService.fetchTable(tableKey, 1, limit)
      bundle[tableKey] = flattenRows(res.items)
    }),
  )

  return bundle
}

/** Builds de-duplicated report-library rows from a synchronized table bundle. */
export function buildReportsFromBundle(bundle: ReportTableBundle): ReportLibraryRow[] {
  const reports: ReportLibraryRow[] = []

  REPORT_TABLE_KEYS.forEach((tableKey) => {
    bundle[tableKey].forEach((row, index) => {
      reports.push(makeReportRow(row, prettyTitle(tableKey), index))
    })
  })

  return reports
}

export function getBundleTableRows(bundle: ReportTableBundle, tableKey: ReportTableKey) {
  return bundle[tableKey] ?? []
}

export interface MisTableRows {
  payments: ReportTableBundle['payments']
  strategies: ReportTableBundle['strategies']
  communications: ReportTableBundle['communications']
}

export function groupTableRowsFromBundle(bundle: ReportTableBundle): MisTableRows {
  return {
    payments: bundle.payments,
    strategies: bundle.strategies,
    communications: bundle.communications,
  }
}
