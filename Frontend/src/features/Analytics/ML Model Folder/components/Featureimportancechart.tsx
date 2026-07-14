import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { FeatureImportanceRow } from "@/features/Analytics/ML Model Folder/types";

interface FeatureImportanceChartProps {
    data: FeatureImportanceRow[];
    topN?: number;
}

export function FeatureImportanceChart({ data, topN = 10 }: FeatureImportanceChartProps) {
    const top = [...data]
        .sort((a, b) => b.importance - a.importance)
        .slice(0, topN)
        .reverse(); // reverse so the biggest bar renders at the top

    return (
        <div className="relative h-full overflow-hidden rounded-2xl border border-[rgba(5,0,88,0.1)] bg-white p-5 shadow-[0_8px_24px_rgba(5,0,88,0.05)]">
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
            <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-navy)]">
                Top features driving predictions
            </h3>
            <div style={{ width: "100%", height: Math.max(240, top.length * 32) }}>
                <ResponsiveContainer>
                    <BarChart
                        data={top}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#05005818" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12, fill: "#5f6f88" }} />
                        <YAxis
                            type="category"
                            dataKey="feature"
                            width={140}
                            tick={{ fontSize: 12, fill: "#050058" }}
                        />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid rgba(5,0,88,0.12)", background: "#ffffff", color: "#050058" }} />
                        <Bar dataKey="importance" fill="#CE9B01" radius={[0, 5, 5, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
