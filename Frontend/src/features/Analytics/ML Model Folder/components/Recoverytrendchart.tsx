import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { TrendPoint } from "@/features/Analytics/ML Model Folder/types";

interface RecoveryTrendChartProps {
  data: TrendPoint[];
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-[rgba(5,0,88,0.1)] bg-white p-5 shadow-[0_8px_24px_rgba(5,0,88,0.05)]">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-navy)]">
        Recovery rate trend - actual vs predicted
      </h3>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#05005818"
              vertical={false}
            />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5f6f88" }} />
            <YAxis
              tick={{ fontSize: 12, fill: "#5f6f88" }}
              tickFormatter={(v) => `${v}%`}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: "1px solid rgba(5,0,88,0.12)",
                background: "#ffffff",
                color: "#050058",
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="actualRate"
              name="Actual"
              stroke="#000182"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="predictedRate"
              name="Predicted"
              stroke="#CE9B01"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
