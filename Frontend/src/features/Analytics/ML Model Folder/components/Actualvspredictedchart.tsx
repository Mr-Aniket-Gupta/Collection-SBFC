import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { ClassComparisonRow } from "@/features/Analytics/ML Model Folder/types";

interface ActualVsPredictedChartProps {
    data: ClassComparisonRow[];
}

export function ActualVsPredictedChart({ data }: ActualVsPredictedChartProps) {
    return (
        <div className="relative h-full overflow-hidden rounded-2xl border border-[rgba(5,0,88,0.1)] bg-white p-5 shadow-[0_8px_24px_rgba(5,0,88,0.05)]">
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blue)] to-transparent" />
            <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-navy)]">
                Actual vs predicted cases by category
            </h3>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#05005818" vertical={false} />
                        <XAxis
                            dataKey="className"
                            tick={{ fontSize: 12, fill: "#5f6f88" }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis tick={{ fontSize: 12, fill: "#5f6f88" }} />
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid rgba(5,0,88,0.12)", background: "#ffffff", color: "#050058" }}
                            formatter={(value: number) => value.toLocaleString()}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="actual" name="Actual" fill="#000182" radius={[5, 5, 0, 0]} />
                        <Bar dataKey="predicted" name="Predicted" fill="#CE9B01" radius={[5, 5, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
