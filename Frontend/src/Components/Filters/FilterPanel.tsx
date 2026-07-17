import React from "react";
import { DateRangeFilter } from "@/Components/DateRangeFilter";
import { ReportSelectFilter } from "@/features/reports/components/ReportSelectFilter";
import type { useReportFilters } from "./useReportFilters";

interface FiltersPanelProps {
  filters: ReturnType<typeof useReportFilters>;
}

export const FilterPanel: React.FC<FiltersPanelProps> = ({ filters }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeFilter
        value={filters.dateRange}
        customFromDate={filters.customFromDate}
        customToDate={filters.customToDate}
        onChange={filters.setDateRange}
        onCustomFromDateChange={filters.setCustomFromDate}
        onCustomToDateChange={filters.setCustomToDate}
      />

      <ReportSelectFilter
        label="Zone"
        value={filters.zoneFilter}
        options={filters.zoneOptions}
        allLabel="All Zones"
        onChange={filters.setZoneFilter}
      />

      <ReportSelectFilter
        label="State"
        value={filters.stateFilter}
        options={filters.stateOptions}
        allLabel="All States"
        onChange={filters.setStateFilter}
      />

      <ReportSelectFilter
        label="Branch"
        value={filters.branchFilter}
        options={filters.branchOptions}
        allLabel="All Branches"
        onChange={filters.setBranchFilter}
      />
    </div>
  );
};

export default FilterPanel;
