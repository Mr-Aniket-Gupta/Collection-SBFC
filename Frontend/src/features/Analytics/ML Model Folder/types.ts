// Shared types used across the ML Analytics dashboard components.
// Replace the mock data in MLAnalyticsPage.tsx with data fetched from
// your API - just make sure it matches these shapes.

export interface KPIData {
  label: string;
  value: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
}
export interface CityMap {
  label: string;
  value: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
}

export interface ClassComparisonRow {
  className: string; // e.g. "Fully Recovered"
  actual: number;
  predicted: number;
}

export interface TrendPoint {
  month: string; // e.g. "Jan"
  actualRate: number; // percentage, e.g. 52.8
  predictedRate: number;
}

export interface ConfusionMatrixData {
  labels: string[]; // class names, same order for rows and columns
  matrix: number[][]; // matrix[actualIndex][predictedIndex] = count
}

export interface FeatureImportanceRow {
  feature: string;
  importance: number; // mean |SHAP value|
}
