// Main page component that assembles the analytics dashboard and its charts.

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock3,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { KPICard } from "../Components/KPICard";
import { PageHeader } from "../Components/PageHeader";
import { PerformanceRadar } from "../charts/PerformanceRadar";
import { StrategyEffectiveness } from "../charts/StrategyEffectiveness";
import { HourlyCallDistribution } from "../charts/HourlyCallDistribution";
import { ProductDistributionChart } from "../charts/ProductDistributionChart";
import { StrategyGapChart } from "../charts/StrategyGapChart";
import { CommunicationEfficiencyChart } from "../charts/CommunicationEfficiencyChart";
import { BranchContributionChart } from "../charts/BranchContributionChart";
import { AgentContributionChart } from "../charts/AgentContributionChart";
import { useAnalytics } from "../hooks/useAnalytics";
import MLAnalyticsPage from "./MLAnalyticsPage";

// JoyTour
import { analyticsPageTourSteps } from "@/Components/tour/analyticsPageTourSteps";
import AppTour from "@/Components/tour/AppTour";

const AGENT_ID = 1;

export const AnalyticsPage: React.FC = () => {
  const [activeDashboard, setActiveDashboard] = useState<"dashboard" | "ml">(
    "dashboard",
  );

  // JoyTour state
  const [runAnalyticsTour, setRunAnalyticsTour] = useState(false);
  const [runMlTour, setRunMlTour] = useState(false);

  const { filters, isRefreshing, dashboard, handleRefresh, error } =
    useAnalytics();

  const radarBest = React.useMemo(() => {
    const items = dashboard?.performanceRadar ?? [];
    return items.length
      ? [...items].sort((a, b) => b.value - a.value)[0]
      : null;
  }, [dashboard?.performanceRadar]);

  const radarWeakest = React.useMemo(() => {
    const items = dashboard?.performanceRadar ?? [];
    return items.length
      ? [...items].sort((a, b) => a.value - b.value)[0]
      : null;
  }, [dashboard?.performanceRadar]);

  const topStrategy = React.useMemo(() => {
    const items = dashboard?.strategyPerformance ?? [];
    return items.length
      ? [...items].sort((a, b) => b.percentage - a.percentage)[0]
      : null;
  }, [dashboard?.strategyPerformance]);

  const peakHour = React.useMemo(() => {
    const items = dashboard?.communicationPerformance ?? [];
    return items.length
      ? [...items].sort((a, b) => b.calls - a.calls)[0]
      : null;
  }, [dashboard?.communicationPerformance]);

  const riskBucket = React.useMemo(() => {
    const items = dashboard?.bucketDistribution ?? [];
    return items.length
      ? [...items].sort((a, b) => b.value - a.value)[0]
      : null;
  }, [dashboard?.bucketDistribution]);

  React.useEffect(() => {
    if (error) {
      toast.error(
        String(
          error instanceof Error
            ? error.message
            : "Unable to load analytics data",
        ),
      );
    }
  }, [error]);

  const analysisSignals = [
    {
      label: "Best performing metric",
      value: radarBest
        ? `${radarBest.metric} ${radarBest.value.toFixed(1)}%`
        : "No data",
      note: "Highest score in the current filtered set",
      icon: TrendingUp,
      tone: "text-[var(--color-gold)]",
      bg: "bg-[rgba(206,155,1,0.12)]",
    },
    {
      label: "Weakest metric",
      value: radarWeakest
        ? `${radarWeakest.metric} ${radarWeakest.value.toFixed(1)}%`
        : "No data",
      note: "This is the first place to improve",
      icon: AlertTriangle,
      tone: "text-[#c2410c]",
      bg: "bg-[rgba(194,65,12,0.12)]",
    },
    {
      label: "Top strategy",
      value: topStrategy
        ? `${topStrategy.name} ${topStrategy.percentage.toFixed(1)}%`
        : "No data",
      note: "Best strategy vs. target",
      icon: Target,
      tone: "text-[var(--color-blue)]",
      bg: "bg-[var(--color-ice)]",
    },
    {
      label: "Peak contact hour",
      value: peakHour ? `${peakHour.hour} (${peakHour.calls})` : "No data",
      note: "Highest communication volume",
      icon: Clock3,
      tone: "text-[var(--color-navy)]",
      bg: "bg-[rgba(5,0,88,0.08)]",
    },
    {
      label: "Risk bucket watch",
      value: riskBucket
        ? `${riskBucket.name} ${riskBucket.value.toFixed(0)}%`
        : "No data",
      note: "Largest portfolio concentration",
      icon: ShieldAlert,
      tone: "text-[var(--color-gold)]",
      bg: "bg-[rgba(206,155,1,0.12)]",
    },
  ];

  useEffect(() => {
    loadAnalyticsTourStatus();
  }, []);

  const loadAnalyticsTourStatus = async () => {
    const response = await fetch(
      `/api/user-tour/analytics-page?agentId=${AGENT_ID}`,
    );
    const data = await response.json();
    if (!data.completed) setRunAnalyticsTour(true);
  };

  const handleAnalyticsFinish = async () => {
    try {
      await fetch("/api/user-tour/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: AGENT_ID,
          tourCode: "analytics-page",
        }),
      });
    } finally {
      setRunAnalyticsTour(false);
      setActiveDashboard("ml");
    }
  };

  const handleRestartTour = async () => {
    const tourCode =
      activeDashboard === "dashboard" ? "analytics-page" : "ml-analytics-page";

    try {
      await fetch("/api/user-tour/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: AGENT_ID, tourCode }),
      });
    } catch (err) {
      console.error("Failed to reset tour status", err);
    }

    if (activeDashboard === "dashboard") {
      setRunAnalyticsTour(false);
      setTimeout(() => setRunAnalyticsTour(true), 50);
    } else {
      setRunMlTour(false);
      setTimeout(() => setRunMlTour(true), 50);
    }
  };

  return (
    <>
      {/* Tour Code */}
      <AppTour
        run={runAnalyticsTour}
        steps={analyticsPageTourSteps}
        onFinish={handleAnalyticsFinish}
      />

      <div className="animate-[fadeIn_0.35s_ease-out_forwards] space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Analytics Dashboard"
          subtitle="Advanced analytics and performance insights"
          filters={filters}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Slice Button */}
        <div className="relative inline-flex rounded-2xl border border-[rgba(5,0,88,0.08)] bg-white p-1 shadow-sm">
          {/* Sliding Background */}
          <div
            className={`absolute top-1 bottom-1 rounded-xl shadow-sm transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeDashboard === "dashboard"
                ? "left-1 w-[220px] bg-[var(--color-blue)]"
                : "left-[221px] w-[180px] bg-[var(--color-gold)]"
            } `}
          />

          <button
            onClick={() => setActiveDashboard("dashboard")}
            className={`relative z-10 px-8 py-3 text-sm font-semibold transition-colors duration-500 w-[220px]
      ${activeDashboard === "dashboard" ? "text-white" : "text-[var(--color-navy)]"}`}
          >
            Analytics Dashboard
          </button>

          <button
            onClick={() => setActiveDashboard("ml")}
            className={`relative z-10 px-8 py-3 text-sm font-semibold transition-colors duration-500 w-[180px]
      ${activeDashboard === "ml" ? "text-white" : "text-[var(--color-navy)]"}`}
          >
            ML Intelligence
          </button>

          {/* Global Restart Tour Button */}
          <button
            onClick={handleRestartTour}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(5,0,88,0.1)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-navy)] shadow-sm hover:bg-[var(--color-ice)] transition-colors"
          >
            Take Tour
          </button>
        </div>

        {activeDashboard === "dashboard" && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {(dashboard?.kpiCards ?? []).map((card, index) => (
                <div key={card.id} id={`analytics-kpi-${index + 1}`}>
                  <KPICard card={card} />
                </div>
              ))}
            </div>

            {/* Cards */}
            <div
              className="surface-card rounded-xl p-4 border border-[rgba(5,0,88,0.08)]"
              id="analytics-card"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {analysisSignals.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <div
                      key={signal.label}
                      className="rounded-xl border border-[rgba(5,0,88,0.08)] bg-white p-4 flex items-start gap-3"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${signal.bg}`}
                      >
                        <Icon className={`h-5 w-5 ${signal.tone}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                          {signal.label}
                        </p>
                        <p className="mt-1 text-[15px] font-bold text-[var(--color-navy)] break-words leading-snug">
                          {signal.value}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--color-ink-muted)] break-words leading-snug">
                          {signal.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Performance Radar + Strategy Effectiveness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div id="analytics-Performance-Radar" className="h-[612px]">
                <PerformanceRadar data={dashboard?.performanceRadar ?? []} />
              </div>

              <div id="analytics-Strategy-Effectiveness" className="h-[650px]">
                <StrategyEffectiveness
                  data={dashboard?.strategyPerformance ?? []}
                />
              </div>
            </div>

            {/* Section 2: Hourly Call Distribution */}
            <div id="analytics-hourly-distribution">
              <HourlyCallDistribution
                data={dashboard?.communicationPerformance ?? []}
              />
            </div>

            {/* Section 3: Strategy vs Target Gap + Communication Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div id="analytics-Strategy-vs-Target-Gap">
                <StrategyGapChart data={dashboard?.strategyGap ?? []} />
              </div>
              <div id="analytics-Communication-Efficiency">
                <CommunicationEfficiencyChart
                  data={dashboard?.communicationEfficiency ?? []}
                />
              </div>
            </div>

            {/* Section 4: Branch Contribution + Agent Contribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div id="analytics-branch-contribution">
                <BranchContributionChart
                  data={dashboard?.branchContributors ?? []}
                />
              </div>
              <div id="analytics-agent-contribution">
                <AgentContributionChart
                  data={dashboard?.agentContributors ?? []}
                />
              </div>
            </div>

            {/* Section 5: Channel Performance + Bucket Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div id="analytics-recovery-efficiency" className="h-[440px]">
                <ProductDistributionChart
                  data={dashboard?.channelPerformance ?? []}
                  title="Recovery Efficiency"
                  subtitle="Recovery efficiency by journey type"
                />
              </div>

              <div id="analytics-risk-bucket">
                <ProductDistributionChart
                  data={dashboard?.bucketDistribution ?? []}
                  title="Portfolio Risk Distribution"
                  subtitle="DPD risk classification breakdown"
                />
              </div>
            </div>
          </>
        )}

        {activeDashboard === "ml" && (
          <MLAnalyticsPage runTour={runMlTour} setRunTour={setRunMlTour} />
        )}
      </div>
    </>
  );
};
