# Frontend — SBFC DCSP Dashboard

React + TypeScript + Vite dashboard for the Digital Collection Strategy Platform.

---

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios (`src/lib/apiClient.ts`)
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Export**: ExcelJS (multi-sheet workbook)
- **Screenshot/Share**: html2canvas + custom utilities

---

## Prerequisites

- Node.js 20+
- npm 9+
- Backend API running at `http://localhost:5166`

---

## Running Locally

```bash
cd Frontend
npm install
npm run dev
# App: http://localhost:5173
```

### Other Scripts

```bash
npm run build      # Production build → dist/
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

---

## Folder Structure

```text
Frontend/src/
│
├── app/
│   ├── App.tsx             # App shell with providers
│   ├── main.tsx            # Entry point
│   └── routes.tsx          # Route definitions
│
├── layout/
│   ├── DashboardLayout.tsx
│   ├── Header/
│   └── Sidebar/
│
├── components/             # Shared reusable components
│   └── dateFilter/         # Date range picker
│
├── lib/
│   └── apiClient.ts        # Axios instance (base URL, interceptors)
│
├── features/
│   │
│   ├── Analytics/
│   │   ├── pages/
│   │   │   └── AnalyticsPage.tsx      # Main analytics dashboard
│   │   ├── hooks/
│   │   │   └── useAnalytics.ts        # Data fetching + filter state
│   │   ├── services/
│   │   │   └── analyticsService.ts    # API calls
│   │   ├── types/
│   │   │   └── analytics.types.ts     # TypeScript interfaces
│   │   └── components/
│   │       ├── PerformanceRadar.tsx
│   │       ├── StrategyEffectiveness.tsx
│   │       ├── StrategyGapChart.tsx
│   │       ├── HourlyCallDistribution.tsx
│   │       ├── CommunicationEfficiencyChart.tsx
│   │       ├── BranchContributionChart.tsx
│   │       ├── AgentContributionChart.tsx
│   │       └── ProductDistributionChart.tsx
│   │
│   └── reports/
│       ├── pages/
│       │   └── ReportsPage.tsx         # Full reports explorer
│       ├── hooks/
│       │   └── useReports.ts           # Paginated table fetching
│       ├── services/
│       │   └── reportsService.ts       # API calls
│       ├── types/
│       │   └── index.ts
│       ├── components/
│       │   ├── CategoryCards.tsx
│       │   └── ShareOptionsModal.tsx
│       ├── charts/                     # Report-specific chart components
│       └── utils/
│           ├── reportFilterEngine.ts   # Bundle filtering by date/branch/zone/state
│           ├── reportDataUtils.ts      # Bundle fetching + report row building
│           ├── chartBuilders.ts        # Chart data transformers
│           ├── misCardMetrics.ts       # Category card metric computation
│           ├── rowDetectors.ts         # Row-type detection helpers
│           ├── tableUtils.ts           # Column formatting utilities
│           ├── reportHelpers.ts        # Row matching and search helpers
│           ├── excelExport.ts          # Multi-sheet workbook export
│           └── captureUtils.ts         # Screenshot and print utilities
```

---

## Routes

| Route                  | Page            | Description                       |
| ---------------------- | --------------- | --------------------------------- |
| `/`                    | Redirect        | Redirects to analytics dashboard  |
| `/analytics/dashboard` | `AnalyticsPage` | Executive KPI and chart dashboard |
| `/reports/:tableKey`   | `ReportsPage`   | Table explorer with filters       |

---

## Filter Architecture

All filters are managed in component state and synchronized to `sessionStorage` for persistence across page reloads.

| Filter     | State variable   | Persisted in sessionStorage key |
| ---------- | ---------------- | ------------------------------- |
| Date Range | `dateRange`      | `reportsDateRange.v2`           |
| From Date  | `customFromDate` | `reportsCustomFromDate.v1`      |
| To Date    | `customToDate`   | `reportsCustomToDate.v1`        |
| Branch     | `branchFilter`   | `reportsBranchFilter.v1`        |
| Zone       | `zoneFilter`     | `reportsZoneFilter.v1`          |
| State      | `stateFilter`    | `reportsStateFilter.v1`         |

### Filter Option Generation

- `extractBranchOptions(bundle)` — reads `bundle.branches` → `name` column
- `extractZoneOptions(bundle)` — reads `bundle.branches` → `zone_code` column
- `extractStateOptions(bundle)` — reads `bundle.branches` → `state` column

**No hardcoded filter values.** All dropdown options come from the database.

### Filter Propagation

```
User changes filter
  ↓
React state update
  ↓
filterBundleByDateRange() → filterBundleByBranchZone()
  ↓
Filtered bundle passed to charts, category cards, and tables
  ↓
All views re-render with filtered data
```

---

## Reports Bundle

The reports page loads a `reportTableBundle` via React Query on first render.  
This bundle contains up to 200 rows from each of these tables:

- `branches`, `dpd-cases`, `strategies`, `pre-emi-cases`, `bounce-cases`, `payments`, `communication_logs`

Filters are applied **in-memory** on this bundle on the frontend.  
All chart data is derived from this filtered bundle via `chartBuilders.ts`.

---

## Analytics Data Flow

```
useAnalytics.ts: filter state changes
  ↓
analyticsService.ts: GET /api/analytics/dashboard?state=...&branch_name=...
  ↓
Backend: AnalyticsController → AnalyticsService → AnalyticsRepository
  ↓
PostgreSQL: filtered aggregation queries
  ↓
DTOs → JSON → useAnalytics.ts state
  ↓
AnalyticsPage renders KPI cards + charts
```

---

## Environment

The API base URL is configured in `src/lib/apiClient.ts`.  
Default: `http://localhost:5166/api`

To change it for different environments, update `apiClient.ts` or create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5166/api
```
