# SBFC Dashboard

This repository contains a full-stack dashboard for SBFC with:

- `Frontend` - React + TypeScript + Vite
- `Backend` - ASP.NET Core Web API + PostgreSQL

The app is centered around two products:

- `Analytics` - executive summary, KPI cards, performance charts, contributor views
- `Reports` - table explorer, filters, charts, exports, and detailed drilldowns

## Project Structure

```text
SBFC/
  Backend/
  Frontend/
  Data/
```

## Architecture

### Flow Diagram

```text
Browser
  -> React Router
  -> DashboardLayout
  -> ReportsPage / AnalyticsPage
  -> apiClient.ts
  -> ASP.NET Core Controllers
  -> Module Repositories
  -> PostgreSQL
  -> JSON response back to charts/tables
```

### Frontend Flow

1. `src/main.tsx` mounts the app.
2. `src/app/App.tsx` provides the app shell.
3. `src/app/routes.tsx` maps routes to pages.
4. `DashboardLayout` keeps the sidebar and header visible.
5. Feature pages render charts, cards, tables, and filters.

### Backend Flow

1. `Program.cs` registers CORS, controllers, Swagger, and database services.
2. `AddReportsModule()` and `AddAnalyticsModule()` register feature services.
3. Controllers expose REST endpoints.
4. Repositories query PostgreSQL and return DTOs.
5. Frontend consumes the JSON and renders chart/table views.

### Frontend Component Tree

```text
src/
  app/
    App.tsx
    main.tsx
    routes.tsx
  layout/
    DashboardLayout.tsx
    Header/
    Sidebar/
  Components/
    ChartCard.tsx
    ChartDataModal.tsx
    Analytics/
      KPICard.tsx
      PageHeader.tsx
      ProgressBar.tsx
  features/
    Analytics/
      pages/AnalyticsPage.tsx
      hooks/useAnalytics.ts
      services/analyticsService.ts
      types/analytics.types.ts
      charts/
        PerformanceRadar.tsx
        StrategyEffectiveness.tsx
        StrategyGapChart.tsx
        HourlyCallDistribution.tsx
        CommunicationEfficiencyChart.tsx
        BranchContributionChart.tsx
        AgentContributionChart.tsx
        ProductDistributionChart.tsx
    reports/
      pages/ReportsPage.tsx
      hooks/useReports.ts
      services/reportsService.ts
      utils/
      charts/
```

## Frontend Pages

### Analytics

Route:

- `/analytics/dashboard`

Main file:

- [`Frontend/src/features/Analytics/pages/AnalyticsPage.tsx`](Frontend/src/features/Analytics/pages/AnalyticsPage.tsx)

What it shows:

- KPI cards
- Radar metrics
- Strategy performance
- Communication performance
- Risk bucket distribution
- Strategy gap chart
- Communication efficiency chart
- Branch contribution chart
- Agent contribution treemap

### Reports

Route:

- `/reports/:tableKey`

Main file:

- [`Frontend/src/features/reports/pages/ReportsPage.tsx`](Frontend/src/features/reports/pages/ReportsPage.tsx)

What it supports:

- table browsing
- date filters
- branch / zone / state filters
- chart modals
- export and share workflows

## Analytics Data Logic

All analytics values are filter-aware and are computed from the current request filters:

- `DateFilter`
- `CustomFromDate`
- `CustomToDate`
- `State`
- `Branch`
- `Zone`

### KPI formulas

The KPI values come from these tables:

- `cases`
- `communications`
- `ptps`

#### Total Outstanding Principal

- Table: `cases`
- Column: `outstanding_principal`
- Current value: `SUM(outstanding_principal)` for closed cases
- Comparison value: `SUM(outstanding_principal)` for all filtered cases

#### Total Outstanding

- Table: `cases`
- Column: `outstanding_total`
- Current value: `SUM(outstanding_total)` for closed cases
- Comparison value: `SUM(outstanding_total)` for all filtered cases

#### Total Delivered

- Table: `communications`
- Column: `status`
- Current value: `COUNT(*) WHERE status = 'delivered'`
- Comparison value: total communication rows in the filtered period

#### PTPs Honoured

- Table: `ptps`
- Column: `honoured`
- Current value: `COUNT(*) WHERE honoured = true`
- Comparison value: total PTP rows in the filtered period

### Trend logic

Each KPI trend compares:

- current filtered period
- previous period of the same length

Formula:

```text
trend % = ((current - previous) / previous) * 100
```

Trend direction:

- `up` if current > previous
- `down` if current < previous
- `neutral` if equal

## API Endpoint Table

| Method | Endpoint | Purpose | Main source |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Full analytics payload | `AnalyticsRepository.GetDashboardAsync` |
| `GET` | `/api/analytics/kpi-cards` | KPI cards only | `GetKpiCardsAsync` |
| `GET` | `/api/analytics/radar` | Radar metrics | `GetRadarAsync` |
| `GET` | `/api/analytics/strategy-performance` | Strategy performance list | `GetStrategyPerformanceAsync` |
| `GET` | `/api/analytics/communication-performance` | Hourly communication stats | `GetCommunicationPerformanceAsync` |
| `GET` | `/api/analytics/channel-performance` | Journey/recovery efficiency split | `GetChannelPerformanceAsync` |
| `GET` | `/api/analytics/bucket-distribution` | DPD bucket distribution | `GetBucketDistributionAsync` |
| `GET` | `/api/reports/{tableKey}` | Report table data | Reports module |

## Analytics Charts

### Performance Radar

File:

- [`Frontend/src/features/Analytics/charts/PerformanceRadar.tsx`](Frontend/src/features/Analytics/charts/PerformanceRadar.tsx)

Logic:

- `Contact Rate = delivered communications / total communications * 100`
- `Response Rate = responded / delivered communications * 100`
- `PTP Success Rate = honoured PTPs / total PTPs * 100`
- `Collection Rate = recovered payment amount / outstanding amount * 100`
- `Payment Success Rate = successful payments / total payments * 100`
- `Case Closure Rate = closed cases / total cases * 100`

### Strategy Effectiveness

File:

- [`Frontend/src/features/Analytics/charts/StrategyEffectiveness.tsx`](Frontend/src/features/Analytics/charts/StrategyEffectiveness.tsx)

Logic:

- Data source: `strategies` joined with `cases`
- Formula: `closed cases for strategy / total cases for strategy * 100`

### Strategy Gap Chart

File:

- [`Frontend/src/features/Analytics/charts/StrategyGapChart.tsx`](Frontend/src/features/Analytics/charts/StrategyGapChart.tsx)

Logic:

- Uses `strategyPerformance`
- `achieved = percentage`
- `target = target`
- `gap = max(target - achieved, 0)`

### Hourly Call Distribution

File:

- [`Frontend/src/features/Analytics/charts/HourlyCallDistribution.tsx`](Frontend/src/features/Analytics/charts/HourlyCallDistribution.tsx)

Logic:

- Table: `communications`
- Group by hour from `created_at`
- `calls = COUNT(*)`
- `responses = COUNT(*) WHERE status = 'delivered'`

### Communication Efficiency

File:

- [`Frontend/src/features/Analytics/charts/CommunicationEfficiencyChart.tsx`](Frontend/src/features/Analytics/charts/CommunicationEfficiencyChart.tsx)

Logic:

- Uses the hourly communication dataset
- `deliveryRate = responses / calls * 100`

### Branch Contribution Chart

File:

- [`Frontend/src/features/Analytics/charts/BranchContributionChart.tsx`](Frontend/src/features/Analytics/charts/BranchContributionChart.tsx)

Logic:

- Table: `cases`
- Group by `branch`
- Measure: `SUM(outstanding_total)`

### Agent Contribution Treemap

File:

- [`Frontend/src/features/Analytics/charts/AgentContributionChart.tsx`](Frontend/src/features/Analytics/charts/AgentContributionChart.tsx)

Logic:

- Tables: `cases` + `agents`
- `allocatedCases = COUNT(cases)`
- `resolvedCases = COUNT(cases WHERE status IN ('closed','settled','resolved'))`
- `recoveredAmount = SUM(outstanding_total)` for resolved cases
- Treemap size uses `allocatedCases`
- Color reflects resolution strength

### Portfolio Risk Distribution

File:

- [`Frontend/src/features/Analytics/charts/ProductDistributionChart.tsx`](Frontend/src/features/Analytics/charts/ProductDistributionChart.tsx)

Logic:

- Table: `cases`
- Column: `dpd`
- Bucket rules:
  - `0-30`
  - `31-60`
  - `61-90`
  - `90+`

## Data Source -> Formula -> Chart Matrix

| Data source | Formula / logic | Chart / UI |
|---|---|---|
| `cases.outstanding_principal` | `SUM(outstanding_principal)` for closed cases vs all filtered cases | KPI: `Total Outstanding Principal` |
| `cases.outstanding_total` | `SUM(outstanding_total)` for closed cases vs all filtered cases | KPI: `Total Outstanding` |
| `communications.status` | `COUNT(status = 'delivered') / total communication rows` | KPI: `Total Delivered` |
| `ptps.honoured` | `COUNT(honoured = true) / total PTP rows` | KPI: `PTPs Honoured` |
| `communications.created_at` | Group by hour; `calls = COUNT(*)`, `responses = delivered count` | `Hourly Call Distribution` |
| `communications` + `ptps` + `payments` + `cases` | Rate formulas per metric | `Performance Radar` |
| `strategies` + `cases` | `closed cases / total cases * 100` | `Strategy Effectiveness` |
| `strategies` + `cases` | `achieved`, `target`, `gap = max(target - achieved, 0)` | `Strategy Gap Chart` |
| `cases.branch` | `SUM(outstanding_total)` grouped by branch | `Branch Contribution Chart` |
| `cases` + `agents` | `allocatedCases`, `resolvedCases`, `recoveredAmount` | `Agent Contribution Treemap` |
| `cases.dpd` | Risk bucket classification by DPD ranges | `Portfolio Risk Distribution` |
| `communications` | `deliveryRate = delivered / sent * 100` | `Communication Efficiency` |

## Backend API Endpoints

Analytics:

- `GET /api/analytics/dashboard`
- `GET /api/analytics/kpi-cards`
- `GET /api/analytics/radar`
- `GET /api/analytics/strategy-performance`
- `GET /api/analytics/communication-performance`
- `GET /api/analytics/channel-performance`
- `GET /api/analytics/bucket-distribution`

Reports:

- `GET /api/reports/{tableKey}`

## Database Tables Used

- `cases`
- `communications`
- `ptps`
- `strategies`
- `agents`
- `payments`

## Local Setup

### Backend

1. Open the `Backend` folder.
2. Ensure PostgreSQL is running.
3. Update `appsettings.json` if needed.
4. Run:

```bash
dotnet run
```

### Frontend

1. Open the `Frontend` folder.
2. Install dependencies if needed.
3. Run:

```bash
npm install
npm run dev
```

## Notes

- Frontend API calls use `src/lib/apiClient.ts`.
- Analytics and Reports both respect the selected filters.
- Build artifacts in `bin/` and `obj/` are generated files and should stay untracked.

## Recommended Cleanup Areas

These are safe follow-up areas if you want a tighter final codebase:

- remove or archive deprecated helpers in `features/reports/utils`
- split large analytics repository queries into smaller query helpers if the file grows further
- keep generated `bin/` and `obj/` folders out of version control

## New Table Checklist

Use this when you add a new database table and want it reflected in the app.

### Step 1: Add or update the database table

- Add the table in PostgreSQL.
- Make sure the important columns are consistent and typed clearly.
- Decide which existing tables it joins with, if any.

### Step 2: Add the backend query

- For analytics-style summaries, update:
  - [`Backend/Modules/Analytics/Repositories/AnalyticsRepository.cs`](Backend/Modules/Analytics/Repositories/AnalyticsRepository.cs)
- For report-table browsing, update:
  - [`Backend/Modules/Reports/Services/ReportsService.cs`](Backend/Modules/Reports/Services/ReportsService.cs)
  - [`Backend/Modules/Reports/Controllers/ReportsController.cs`](Backend/Modules/Reports/Controllers/ReportsController.cs)

What to add:

- SQL query for the new table
- joins to related tables
- filters for date, branch, state, zone, or custom dimensions
- aggregate formulas if the table feeds charts or KPI cards

### Step 3: Update DTOs and response shapes

- Add new backend DTO fields in:
  - [`Backend/Modules/Analytics/DTOs/AnalyticsDtos.cs`](Backend/Modules/Analytics/DTOs/AnalyticsDtos.cs)
- If the table is part of generic report data, also check:
  - [`Backend/Common/Dtos`](Backend/Common/Dtos)

### Step 4: Update frontend types

- Add or extend the TypeScript types in:
  - [`Frontend/src/features/Analytics/types/analytics.types.ts`](Frontend/src/features/Analytics/types/analytics.types.ts)
  - [`Frontend/src/features/reports/types/index.ts`](Frontend/src/features/reports/types/index.ts)

### Step 5: Update the service layer

- If the table has a new analytics endpoint, update:
  - [`Frontend/src/features/Analytics/services/analyticsService.ts`](Frontend/src/features/Analytics/services/analyticsService.ts)
- If it is a report table, update:
  - [`Frontend/src/features/reports/services/reportsService.ts`](Frontend/src/features/reports/services/reportsService.ts)

### Step 6: Add chart or table UI

- Analytics charts live in:
  - [`Frontend/src/features/Analytics/charts`](Frontend/src/features/Analytics/charts)
- Report charts live in:
  - [`Frontend/src/features/reports/charts`](Frontend/src/features/reports/charts)
- Page-level rendering happens in:
  - [`Frontend/src/features/Analytics/pages/AnalyticsPage.tsx`](Frontend/src/features/Analytics/pages/AnalyticsPage.tsx)
  - [`Frontend/src/features/reports/pages/ReportsPage.tsx`](Frontend/src/features/reports/pages/ReportsPage.tsx)

### Step 7: Update filters and table mappings

If the new table should respond to global filters or categories, update:

- [`Frontend/src/features/reports/utils/reportFilterEngine.ts`](Frontend/src/features/reports/utils/reportFilterEngine.ts)
- [`Frontend/src/features/reports/utils/categoryFilters.ts`](Frontend/src/features/reports/utils/categoryFilters.ts)
- [`Frontend/src/features/reports/components/CategoryCards.tsx`](Frontend/src/features/reports/components/CategoryCards.tsx)

### Step 8: Update routes only if needed

Usually routes stay the same, but if you add a new page or new report section, check:

- [`Frontend/src/app/routes.tsx`](Frontend/src/app/routes.tsx)

### Step 9: Update docs

- Add a short note in this README about:
  - source table
  - formula
  - endpoint
  - chart or page usage

### Quick sanity check

Before calling it done, confirm:

- the backend builds
- the frontend builds
- the new table appears in the right filters or charts
- percentages never exceed `100%` unless that is intentionally a count display
- refresh buttons still reset filters correctly
