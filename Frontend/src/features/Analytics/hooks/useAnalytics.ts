// Custom hook that manages state and fetches data for the analytics dashboard.

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analyticsService";
import { fetchReportTableBundle } from "@/features/reports/utils/reportDataUtils";
import { useReportFilters } from "@/Components/Filters/useReportFilters";
import { EMPTY_BUNDLE } from "@/features/reports/utils/reportFilterEngine";

export function useAnalytics() {
  const { data: tableBundle } = useQuery({
    queryKey: ["analyticsCaseOptions"],
    queryFn: () => fetchReportTableBundle(200, ["branches", "dpd-cases"]),
    placeholderData: (prev) => prev,
  });

  const filters = useReportFilters(tableBundle ?? EMPTY_BUNDLE());
  const branchMapRef = useRef<Map<string, string>>(new Map());

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: [
      "analyticsDashboard",
      filters.dateRange,
      filters.customFromDate,
      filters.customToDate,
      filters.branchFilter,
      filters.zoneFilter,
      filters.stateFilter,
    ],
    queryFn: async () => {
      const branchForApi = filters.branchFilter
        ? (branchMapRef.current.get(filters.branchFilter) ??
          filters.branchFilter)
        : undefined;
      console.debug(
        "[Analytics] fetching dashboard with branchForApi=",
        branchForApi,
        "branchFilter=",
        filters.branchFilter,
        "zone=",
        filters.zoneFilter,
        "state=",
        filters.stateFilter,
      );
      const resp = await analyticsService.fetchDashboard(
        filters.dateRange,
        filters.customFromDate,
        filters.customToDate,
        branchForApi,
        filters.zoneFilter,
        filters.stateFilter,
      );
      console.debug("[Analytics] dashboard response:", resp);
      return resp;
    },
    placeholderData: (prev) => prev,
  });

  const handleRefresh = () => {
    filters.resetFilters();
    refetch();
  };

  return {
    filters,
    isRefreshing: isFetching,
    dashboard: data,
    error,
    handleRefresh,
  };
}
