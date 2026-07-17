import type { DcspTableRow } from "@/features/reports/types";
import {
  getBranchName,
  safeToString,
} from "@/features/reports/utils/tableUtils";
import {
  EMPTY_BUNDLE,
  REPORT_TABLE_KEYS,
  type ReportTableBundle,
} from "@/features/reports/utils/reportFilterEngine";

export const norm = (value: unknown): string =>
  safeToString(value).toString().trim().replace(/\s+/g, " ").toUpperCase();
export const id = (value: unknown): string => safeToString(value).trim();

export function extractBranchOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>();
  if (bundle.branches && bundle.branches.length > 0) {
    bundle.branches.forEach((row) => {
      const branch = getBranchName(row);
      if (branch) values.add(branch);
    });
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function extractZoneOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>();
  if (bundle.branches && bundle.branches.length > 0) {
    bundle.branches.forEach((row) => {
      const zone = safeToString(row.zone_code || row.zone).trim();
      if (zone) values.add(zone);
    });
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function extractStateOptions(bundle: ReportTableBundle): string[] {
  const values = new Set<string>();
  if (bundle.branches && bundle.branches.length > 0) {
    bundle.branches.forEach((row) => {
      const state = safeToString(row.state || row.region_code).trim();
      if (state) values.add(state);
    });
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

const bundleFilterCache = new WeakMap<
  ReportTableBundle,
  Map<string, ReportTableBundle>
>();

function setCache(
  bundle: ReportTableBundle,
  key: string,
  value: ReportTableBundle,
) {
  let m = bundleFilterCache.get(bundle);
  if (!m) {
    m = new Map<string, ReportTableBundle>();
    bundleFilterCache.set(bundle, m);
  }
  m.set(key, value);
}

export function filterBundleByBranchZone(
  bundle: ReportTableBundle,
  branchFilter: string,
  zoneFilter: string,
  stateFilter: string,
): ReportTableBundle {
  const cacheForBundle = bundleFilterCache.get(bundle);
  const key = JSON.stringify({
    b: branchFilter || "",
    z: zoneFilter || "",
    s: stateFilter || "",
  });
  if (cacheForBundle?.has(key))
    return cacheForBundle.get(key) as ReportTableBundle;

  if (!branchFilter && !zoneFilter && !stateFilter) {
    setCache(bundle, key, bundle);
    return bundle;
  }

  const allowedBranches = new Set<string>();
  const filteredBranches = bundle.branches.filter((row) => {
    const name = getBranchName(row);
    if (branchFilter && norm(name) !== norm(branchFilter)) return false;
    if (zoneFilter && norm(row.zone_code || row.zone) !== norm(zoneFilter))
      return false;
    if (stateFilter && norm(row.state || row.region_code) !== norm(stateFilter))
      return false;
    return true;
  });

  filteredBranches.forEach((row) => {
    const name = getBranchName(row);
    if (name) allowedBranches.add(norm(name));
  });

  if (allowedBranches.size === 0) {
    setCache(bundle, key, EMPTY_BUNDLE());
    return EMPTY_BUNDLE();
  }

  const finalCaseIds = new Set<string>();
  const finalStrategyIds = new Set<string>();

  const processCaseRow = (row: DcspTableRow) => {
    const branchVal = norm(getBranchName(row) || row.branch_name || "");
    if (allowedBranches.has(branchVal)) {
      const caseId = id(
        row.case_id ??
          row.dpd_case_id ??
          row.bounce_case_id ??
          row.pre_emi_case_id,
      );
      const strategyId = id(row.strategy_id);
      if (caseId) finalCaseIds.add(caseId);
      if (strategyId) finalStrategyIds.add(strategyId);
    }
  };

  bundle["dpd-cases"].forEach(processCaseRow);
  bundle["bounce-cases"].forEach(processCaseRow);

  if (finalCaseIds.size === 0 && finalStrategyIds.size === 0) {
    setCache(bundle, key, EMPTY_BUNDLE());
    return EMPTY_BUNDLE();
  }

  const filtered = EMPTY_BUNDLE();

  REPORT_TABLE_KEYS.forEach((tableKey) => {
    if (tableKey === "branches") {
      filtered.branches = filteredBranches;
      return;
    }

    filtered[tableKey] = bundle[tableKey].filter((row) => {
      const caseId = id(
        row.case_id ??
          row.dpd_case_id ??
          row.bounce_case_id ??
          row.pre_emi_case_id,
      );
      const strategyId = id(row.strategy_id);
      const matchCase = caseId !== "" && finalCaseIds.has(caseId);
      const matchStrategy =
        strategyId !== "" && finalStrategyIds.has(strategyId);
      return matchCase || matchStrategy;
    });
  });

  setCache(bundle, key, filtered);
  return filtered;
}
