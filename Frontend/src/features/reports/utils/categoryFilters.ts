import type { DcspTableRow, ReportLibraryRow } from '../types'
import {
  applyCategoryGlobalFilter,
  CATEGORY_FILTER_CONFIG,
  type ReportTableBundle,
} from './reportFilterEngine'
import { buildReportsFromBundle } from './reportDataUtils'
export { isCaseRow, isCommunicationRow, isPaymentRow } from './rowDetectors'

/** @deprecated Use CATEGORY_FILTER_CONFIG + reportFilterEngine for global ID propagation. */
export const CATEGORY_ROW_FILTERS: Record<string, (source: DcspTableRow) => boolean> =
  Object.fromEntries(
    Object.entries(CATEGORY_FILTER_CONFIG).map(([title, config]) => [
      title,
      config.primaryPredicate,
    ]),
  )

/** Applies global ID-based category filter to a synchronized table bundle. */
export function filterBundleByCategory(
  bundle: ReportTableBundle,
  categoryTitle: string,
): ReportTableBundle {
  return applyCategoryGlobalFilter(bundle, categoryTitle).bundle
}

/** Builds report-library rows after global category filter (keeps all tables in sync). */
export function filterReportsByCategory(
  reports: ReportLibraryRow[],
  categoryTitle: string,
  sourceBundle?: ReportTableBundle,
): ReportLibraryRow[] {
  if (!categoryTitle) return reports
  if (!sourceBundle) {
    const filterFn = CATEGORY_ROW_FILTERS[categoryTitle]
    if (!filterFn) return reports.filter((r) => r.category === categoryTitle)
    return reports.filter((r) => filterFn(r.source))
  }
  return buildReportsFromBundle(filterBundleByCategory(sourceBundle, categoryTitle))
}
