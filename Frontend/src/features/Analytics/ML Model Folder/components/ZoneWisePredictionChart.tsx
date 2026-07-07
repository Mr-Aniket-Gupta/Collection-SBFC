import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  {
    zone: "North",
    actual: 72,
    predicted: 78,
  },
  {
    zone: "South",
    actual: 68,
    predicted: 74,
  },
  {
    zone: "West",
    actual: 81,
    predicted: 86,
  },
  {
    zone: "East",
    actual: 63,
    predicted: 69,
  },
  {
    zone: "Central",
    actual: 75,
    predicted: 79,
  },
];

const COLORS = {
  actual: "#3B82F6",
  predicted: "#D4A017",
  grid: "#E5E7EB",
  text: "#6B7280",
};

export default function ZoneWisePredictionChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Zone Wise Recovery Prediction
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Comparison between actual recovery and ML predicted recovery
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke={COLORS.grid}
          />

          <XAxis
            dataKey="zone"
            tick={{ fill: COLORS.text }}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: COLORS.text }}
            unit="%"
          />

          {/* <Tooltip
            formatter={(value: number) => `${value}%`}
          /> */}

          <Legend />

          <Line
            type="monotone"
            dataKey="actual"
            stroke={COLORS.actual}
            strokeWidth={3}
            dot={{
              r: 5,
            }}
            activeDot={{
              r: 7,
            }}
            name="Actual Recovery"
          />

          <Line
            type="monotone"
            dataKey="predicted"
            stroke={COLORS.predicted}
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={{
              r: 5,
            }}
            activeDot={{
              r: 7,
            }}
            name="Predicted Recovery"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}