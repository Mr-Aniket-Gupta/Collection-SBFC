// PageHeader Component - Renders page title and filter controls for analytics

import React from "react";
import { RotateCw } from "lucide-react";
import { FilterPanel } from "@/Components/Filters/FilterPanel";
import type { useReportFilters } from "@/Components/Filters/useReportFilters";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  filters: ReturnType<typeof useReportFilters>;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  filters,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="surface-card rounded-xl px-5 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      {/* Title Block */}
      <div>
        <h1 className="text-[24px] font-bold text-[var(--color-navy)] leading-tight">
          {title}
        </h1>
        <p className="text-[13px] text-[var(--color-ink-muted)] mt-0.5 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPanel filters={filters} />

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RotateCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default PageHeader;
