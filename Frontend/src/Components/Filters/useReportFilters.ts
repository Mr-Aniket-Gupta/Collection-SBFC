import { useState, useEffect, useMemo } from "react";
import type { DateRangeOption } from "@/features/reports/types";
import {
  getDefaultCustomFromDate,
  getDefaultCustomToDate,
  DEFAULT_DATE_RANGE,
} from "@/Components/dateFilter";
import type { ReportTableBundle } from "@/features/reports/utils/reportFilterEngine";
import {
  getBranchName,
  safeToString,
} from "@/features/reports/utils/tableUtils";

export interface UseReportFiltersOptions {
  storageKeyPrefix?: string;
}

export function useReportFilters(
  bundle: ReportTableBundle | undefined,
  options?: UseReportFiltersOptions,
) {
  const prefix = options?.storageKeyPrefix;

  const readStored = (keySuffix: string, fallback: string) => {
    if (!prefix) return fallback;
    const stored = sessionStorage.getItem(`${prefix}${keySuffix}`);
    return stored ?? fallback;
  };

  const [dateRange, setDateRange] = useState<DateRangeOption>(() => {
    const val = readStored("DateRange", DEFAULT_DATE_RANGE);
    return val as DateRangeOption;
  });
  const [customFromDate, setCustomFromDate] = useState<string>(() =>
    readStored("CustomFrom", getDefaultCustomFromDate()),
  );
  const [customToDate, setCustomToDate] = useState<string>(() =>
    readStored("CustomTo", getDefaultCustomToDate()),
  );
  const [branchFilter, setBranchFilter] = useState<string>(() =>
    readStored("Branch", ""),
  );
  const [zoneFilter, setZoneFilter] = useState<string>(() =>
    readStored("Zone", ""),
  );
  const [stateFilter, setStateFilter] = useState<string>(() =>
    readStored("State", ""),
  );

  useEffect(() => {
    if (prefix) sessionStorage.setItem(`${prefix}DateRange`, dateRange);
  }, [dateRange, prefix]);

  useEffect(() => {
    if (prefix) sessionStorage.setItem(`${prefix}CustomFrom`, customFromDate);
  }, [customFromDate, prefix]);

  useEffect(() => {
    if (prefix) sessionStorage.setItem(`${prefix}CustomTo`, customToDate);
  }, [customToDate, prefix]);

  useEffect(() => {
    if (prefix) sessionStorage.setItem(`${prefix}Branch`, branchFilter);
  }, [branchFilter, prefix]);

  useEffect(() => {
    if (prefix) sessionStorage.setItem(`${prefix}Zone`, zoneFilter);
  }, [zoneFilter, prefix]);

  useEffect(() => {
    if (prefix) sessionStorage.setItem(`${prefix}State`, stateFilter);
  }, [stateFilter, prefix]);

  const normalizeFilterValue = (value?: string) =>
    (value ?? "").toString().trim().toLowerCase();

  const branchOptions = useMemo(() => {
    if (!bundle?.branches) return [];
    const values = new Set<string>();
    bundle.branches.forEach((row: any) => {
      const branch = getBranchName(row);
      const rowZone = safeToString(row.zone_code || row.zone).trim();
      const rowState = safeToString(row.state || row.region_code).trim();
      if (
        zoneFilter &&
        rowZone &&
        normalizeFilterValue(rowZone) !== normalizeFilterValue(zoneFilter)
      )
        return;
      if (
        stateFilter &&
        rowState &&
        normalizeFilterValue(rowState) !== normalizeFilterValue(stateFilter)
      )
        return;
      if (branch) values.add(branch);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [bundle, zoneFilter, stateFilter]);

  const zoneOptions = useMemo(() => {
    if (!bundle?.branches) return [];
    const values = new Set<string>();
    bundle.branches.forEach((row: any) => {
      const branch = getBranchName(row);
      const rowZone = safeToString(row.zone_code || row.zone).trim();
      const rowState = safeToString(row.state || row.region_code).trim();
      if (
        branchFilter &&
        branch &&
        normalizeFilterValue(branch) !== normalizeFilterValue(branchFilter)
      )
        return;
      if (
        stateFilter &&
        rowState &&
        normalizeFilterValue(rowState) !== normalizeFilterValue(stateFilter)
      )
        return;
      if (rowZone) values.add(rowZone);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [bundle, branchFilter, stateFilter]);

  const stateOptions = useMemo(() => {
    if (!bundle?.branches) return [];
    const values = new Set<string>();
    bundle.branches.forEach((row: any) => {
      const branch = getBranchName(row);
      const rowZone = safeToString(row.zone_code || row.zone).trim();
      const rowState = safeToString(row.state || row.region_code).trim();
      if (
        branchFilter &&
        branch &&
        normalizeFilterValue(branch) !== normalizeFilterValue(branchFilter)
      )
        return;
      if (
        zoneFilter &&
        rowZone &&
        normalizeFilterValue(rowZone) !== normalizeFilterValue(zoneFilter)
      )
        return;
      if (rowState) values.add(rowState);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [bundle, branchFilter, zoneFilter]);

  useEffect(() => {
    if (branchFilter && !branchOptions.includes(branchFilter)) {
      setBranchFilter("");
    }
  }, [branchFilter, branchOptions]);

  useEffect(() => {
    if (zoneFilter && !zoneOptions.includes(zoneFilter)) {
      setZoneFilter("");
    }
  }, [zoneFilter, zoneOptions]);

  useEffect(() => {
    if (stateFilter && !stateOptions.includes(stateFilter)) {
      setStateFilter("");
    }
  }, [stateFilter, stateOptions]);

  const resetFilters = () => {
    setDateRange(DEFAULT_DATE_RANGE);
    setCustomFromDate(getDefaultCustomFromDate());
    setCustomToDate(getDefaultCustomToDate());
    setBranchFilter("");
    setZoneFilter("");
    setStateFilter("");
  };

  return {
    dateRange,
    setDateRange,
    customFromDate,
    setCustomFromDate,
    customToDate,
    setCustomToDate,
    branchFilter,
    setBranchFilter,
    zoneFilter,
    setZoneFilter,
    stateFilter,
    setStateFilter,
    branchOptions,
    zoneOptions,
    stateOptions,
    resetFilters,
  };
}
