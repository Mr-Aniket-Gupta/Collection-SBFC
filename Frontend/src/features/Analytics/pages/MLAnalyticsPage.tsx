import { useState, useEffect } from "react";
import { Activity, BrainCircuit, Sparkles } from "lucide-react";
import { KPIGrid } from "@/features/Analytics/ML Model Folder/components/Kpicard";
import { ActualVsPredictedChart } from "@/features/Analytics/ML Model Folder/components/Actualvspredictedchart";
import { RecoveryTrendChart } from "@/features/Analytics/ML Model Folder/components/Recoverytrendchart";
import { ConfusionMatrixHeatmap } from "@/features/Analytics/ML Model Folder/components/Confusionmatrixheatmap";
import { FeatureImportanceChart } from "@/features/Analytics/ML Model Folder/components/Featureimportancechart";
import {
  KPIData,
  ClassComparisonRow,
  TrendPoint,
  ConfusionMatrixData,
  FeatureImportanceRow,
} from "@/features/Analytics/ML Model Folder/types";

import HexWorldMap from "@/features/Analytics/ML Model Folder/components/Hexworldmap";

// JoyTour
// import { mlAnalyticsTourSteps } from "@/Components/tour/mlAnalyticsTourSteps";
// import AppTour from "@/Components/tour/AppTour";

// ---------------------------------------------------------------------
// MOCK DATA - replace each of these with a real API call, e.g.:
//   const { data } = useQuery(["ml-analytics"], fetchMLAnalytics);
// Keep the shapes matching the types in components/MLAnalytics/types.ts
// ---------------------------------------------------------------------

const mockKPIs: KPIData[] = [
  { label: "Total cases", value: "17,685" },
  {
    label: "Actual recovery rate",
    value: "52.8%",
    trend: { value: "1.2%", direction: "up" },
  },
  {
    label: "Predicted recovery rate",
    value: "50.1%",
    trend: { value: "0.8%", direction: "down" },
  },
  { label: "Model accuracy", value: "71%" },
];

const mockClassComparison: ClassComparisonRow[] = [
  { className: "Fully Recovered", actual: 1240, predicted: 1050 },
  { className: "High Risk", actual: 2306, predicted: 2480 },
  { className: "Likely Recoverable", actual: 4242, predicted: 4180 },
  { className: "Partially Recovered", actual: 8165, predicted: 8300 },
  { className: "Write Off", actual: 1732, predicted: 1675 },
];

const mockTrend: TrendPoint[] = [
  { month: "Jan", actualRate: 51, predictedRate: 49 },
  { month: "Feb", actualRate: 49, predictedRate: 48 },
  { month: "Mar", actualRate: 53, predictedRate: 51 },
  { month: "Apr", actualRate: 52, predictedRate: 50 },
  { month: "May", actualRate: 54, predictedRate: 52 },
  { month: "Jun", actualRate: 52.8, predictedRate: 50.1 },
];

const mockConfusionMatrix: ConfusionMatrixData = {
  labels: [
    "Write Off",
    "High Risk",
    "Likely Recoverable",
    "Partially Recovered",
    "Fully Recovered",
  ],
  matrix: [
    [1541, 120, 45, 20, 6],
    [95, 1798, 310, 88, 15],
    [40, 350, 2884, 890, 78],
    [15, 90, 720, 5879, 1461],
    [3, 12, 60, 750, 415],
  ],
};

const mockFeatureImportance: FeatureImportanceRow[] = [
  { feature: "dpd", importance: 0.42 },
  { feature: "outstanding_ratio", importance: 0.35 },
  { feature: "days_since_last_payment", importance: 0.31 },
  { feature: "did_respond", importance: 0.27 },
  { feature: "retry_count", importance: 0.22 },
  { feature: "agent_load_ratio", importance: 0.18 },
  { feature: "bucket", importance: 0.15 },
  { feature: "last_comm_channel", importance: 0.12 },
  { feature: "customer_segment", importance: 0.09 },
  { feature: "priority", importance: 0.07 },
];

interface MLAnalyticsPageProps {
  runTour: boolean;
  setRunTour: React.Dispatch<React.SetStateAction<boolean>>;
}

const AGENT_ID = 1;

export default function MLAnalyticsPage({
  runTour,
  setRunTour,
}: MLAnalyticsPageProps) {
  // In production, swap these useState blocks for your real
  // data-fetching hook (React Query / SWR / plain fetch in useEffect).
  const [kpis] = useState<KPIData[]>(mockKPIs);
  const [classComparison] = useState<ClassComparisonRow[]>(mockClassComparison);
  const [trend] = useState<TrendPoint[]>(mockTrend);
  const [confusionMatrix] = useState<ConfusionMatrixData>(mockConfusionMatrix);
  const [featureImportance] = useState<FeatureImportanceRow[]>(
    mockFeatureImportance,
  );

  useEffect(() => {
    loadMlTourStatus();
  }, []);

  const loadMlTourStatus = async () => {
    try {
      const response = await fetch(
        `/api/user-tour/ml-analytics-page?agentId=${AGENT_ID}`,
      );
      const data = await response.json();
      if (!data.completed) {
        setRunTour(true);
      }
    } catch (err) {
      console.error("Failed to load ML tour status", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setRunTour(true);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMlFinish = async () => {
    try {
      await fetch("/api/user-tour/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: AGENT_ID,
          tourCode: "ml-analytics-page",
        }),
      });
    } finally {
      setRunTour(false);
    }
  };

  return (
    <>
      {/* <AppTour
        run={runTour}
        steps={mlAnalyticsTourSteps}
        onFinish={handleMlFinish}
      /> */}

      <main className="relative mx-auto max-w-[1600px] overflow-hidden rounded-[28px] border border-[rgba(5,0,88,0.1)] bg-[#f8fbff] p-4 text-[var(--color-navy)] shadow-[0_20px_50px_rgba(5,0,88,0.08)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(5,0,88,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(5,0,88,0.025)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative space-y-5">
          <div id="tour-hero-section">
            <header className="relative overflow-hidden rounded-2xl border border-[rgba(5,0,88,0.1)] bg-[radial-gradient(circle_at_84%_15%,rgba(206,155,1,0.13),transparent_24%),radial-gradient(circle_at_68%_95%,rgba(217,234,245,0.9),transparent_34%),linear-gradient(120deg,#ffffff,#f4f9fd_58%,#edf6fb)] px-5 py-6 shadow-[0_12px_32px_rgba(5,0,88,0.06)] sm:px-7 sm:py-7">
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[var(--color-gold)] to-transparent" />

              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[rgba(0,1,130,0.1)]" />
              <div className="absolute right-12 top-8 h-20 w-20 rounded-full border border-[rgba(206,155,1,0.2)]" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* icon */}
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-[rgba(0,1,130,0.15)] bg-[var(--color-ice)] text-[var(--color-blue)] shadow-[0_10px_24px_rgba(5,0,88,0.1)]">
                    <BrainCircuit size={25} strokeWidth={1.8} />
                  </div>

                  {/* title */}
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
                      <Sparkles size={13} /> Model intelligence
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-navy)] sm:text-3xl">
                      Recovery ML analytics
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                      Actual vs predicted performance
                    </p>
                  </div>
                </div>

                {/* buttons */}
                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-2 rounded-full border border-[rgba(5,0,88,0.1)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--color-blue)] sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)] shadow-[0_0_10px_rgba(206,155,1,0.7)]" />
                    <Activity size={14} /> Model active
                  </div>
                </div>
              </div>
            </header>
          </div>

          <div className="p-6">
            <h1 className="text-xl font-bold mb-4" id="tour-world-map">
              User distribution
            </h1>
            <HexWorldMap />
          </div>

          <div id="tour-kpi-grid">
            <KPIGrid items={kpis} />
          </div>

          <section className="grid grid-cols-1 gap-5 2xl:grid-cols-12">
            <div className="2xl:col-span-7" id="tour-actual-vs-predicted">
              <ActualVsPredictedChart data={classComparison} />
            </div>
            <div className="2xl:col-span-5" id="tour-recovery-trend">
              <RecoveryTrendChart data={trend} />
            </div>
            <div className="2xl:col-span-7" id="tour-confusion-matrix">
              <ConfusionMatrixHeatmap data={confusionMatrix} />
            </div>
            <div className="2xl:col-span-5" id="tour-feature-importance">
              <FeatureImportanceChart data={featureImportance} />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
