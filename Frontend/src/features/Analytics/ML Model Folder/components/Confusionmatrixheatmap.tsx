import React from "react";
import { ConfusionMatrixData } from "@/features/Analytics/ML Model Folder/types";

interface ConfusionMatrixHeatmapProps {
  data: ConfusionMatrixData;
}

// Returns a background color whose opacity scales with the cell's share
// of its row total - darker cell = model got more of these cases right
// (on the diagonal) or confused them with a specific other class (off-diagonal).
function getCellStyle(value: number, rowMax: number): React.CSSProperties {
  const intensity = rowMax === 0 ? 0 : value / rowMax;
  return {
    backgroundColor: `rgba(0, 1, 130, ${0.08 + intensity * 0.68})`,
    color: intensity > 0.55 ? "#ffffff" : "#050058",
  };
}

export function ConfusionMatrixHeatmap({ data }: ConfusionMatrixHeatmapProps) {
  const { labels, matrix } = data;

  return (
    <div className="relative h-full overflow-x-auto rounded-2xl border border-[rgba(5,0,88,0.1)] bg-white p-5 shadow-[0_8px_24px_rgba(5,0,88,0.05)]">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blue)] to-transparent" />
      <h3 className="mb-1 text-sm font-semibold tracking-tight text-[var(--color-navy)]">
        Confusion matrix
      </h3>
      <p className="mb-4 text-xs text-[var(--color-ink-muted)]">
        Rows = actual class, columns = predicted class
      </p>
      <table className="text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th className="p-2"></th>
            {labels.map((label) => (
              <th
                key={label}
                className="p-2 text-center font-medium text-[var(--color-ink-muted)]"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => {
            const rowMax = Math.max(...row);
            return (
              <tr key={labels[i]}>
                <td className="whitespace-nowrap p-2 font-medium text-[var(--color-blue)]">
                  {labels[i]}
                </td>
                {row.map((value, j) => (
                  <td
                    key={j}
                    className="p-2 text-center rounded"
                    style={getCellStyle(value, rowMax)}
                  >
                    {value.toLocaleString()}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
