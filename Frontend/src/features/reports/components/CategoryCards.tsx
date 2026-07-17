import React from "react";
import { RotateCw, ChevronRight } from "lucide-react";
import type { ReportTableKey } from "../hooks/useReports";
import type { MisCardMetric } from "../utils/misCardMetrics";
import { FilterPanel } from "@/Components/Filters/FilterPanel";
import type { useReportFilters } from "@/Components/Filters/useReportFilters";

export interface CategoryCardConfig {
  id: string;
  title: string;
  tableKey: ReportTableKey;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
}

interface CategoryCardsProps {
  cards: CategoryCardConfig[];
  selectedCategory: string;
  categoryMetrics: Map<string, MisCardMetric>;
  filters: ReturnType<typeof useReportFilters>;
  onSelectCategory: (card: CategoryCardConfig) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  cards,
  selectedCategory,
  categoryMetrics,
  filters,
  onSelectCategory,
  onRefresh,
  isRefreshing = false,
}) => (
  <>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-[16px] font-bold text-[var(--color-navy)]">
          Report Categories
        </h3>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          Click a card to filter dashboards &amp; table
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPanel filters={filters} />
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-lg border border-[rgba(5,0,88,0.08)] bg-white px-3 py-2 text-[13px] font-bold text-[var(--color-navy)] shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RotateCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      {/* Top Row: First 5 Cards */}
      <div className="flex flex-wrap gap-3">
        {cards.slice(0, 4).map((card) => {
          const isActive = selectedCategory === card.title;
          const metric = categoryMetrics.get(card.title);

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCategory(card)}
              style={{ flex: "1 1 190px" }}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 min-h-[150px] ${
                isActive
                  ? "border-[var(--color-gold)] bg-[#FFFBF2] shadow-md ring-2 ring-[rgba(206,155,1,0.18)]"
                  : "border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] hover:-translate-y-1 hover:shadow-xl hover:border-[rgba(206,155,1,0.35)] hover:shadow-md"
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-bold leading-snug text-[var(--color-navy)]">
                    {card.title}
                  </h4>
                  <p className="mt-1 text-[22px] font-extrabold leading-none text-[var(--color-navy)]">
                    {metric?.value ?? "—"}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
                    {metric?.subtitle ?? "Click to load"}
                  </p>
                </div>

                <div className="absolute right-4 top-4 text-gray-400 transition-transform group-hover:translate-x-1">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Row: Remaining 4 Cards */}
      <div className="flex flex-wrap gap-3">
        {cards.slice(4).map((card) => {
          const isActive = selectedCategory === card.title;
          const metric = categoryMetrics.get(card.title);

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCategory(card)}
              style={{ flex: "1 1 180px" }}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 min-h-[150px] ${
                isActive
                  ? "border-[var(--color-gold)] bg-[#FFFBF2] shadow-md ring-2 ring-[rgba(206,155,1,0.18)]"
                  : "border-[rgba(5,0,88,0.08)] bg-[#FAFBFD] hover:-translate-y-1 hover:shadow-xl hover:border-[rgba(206,155,1,0.35)] hover:shadow-md"
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-bold leading-snug text-[var(--color-navy)]">
                    {card.title}
                  </h4>
                  <p className="mt-1 text-[22px] font-extrabold leading-none text-[var(--color-navy)]">
                    {metric?.value ?? "—"}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
                    {metric?.subtitle ?? "Click to load"}
                  </p>
                </div>
                <div className="absolute right-4 top-4 text-gray-400 transition-transform group-hover:translate-x-1">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </>
);
