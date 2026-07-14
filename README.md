# SBFC Digital Collection Strategy Platform

Full-stack enterprise dashboard for managing digital loan collection operations.

- **Frontend** — React + TypeScript + Vite
- **Backend** — ASP.NET Core Web API (.NET 8)
- **Database** — PostgreSQL (schemas: `auth`, `col_db`)

The app has two main feature areas:

- **Analytics** — executive KPI cards, performance radar, strategy charts, agent/branch contributors
- **Reports** — paginated table explorer, date/branch/zone/state filters, multi-sheet Excel export, and chart drilldowns

## Project Structure

```text
SBFC/
  Backend/          ← ASP.NET Core Web API
  Frontend/         ← React + TypeScript + Vite
  Data/             ← ML / ETL scripts (excluded from app)
  .github/          ← CI/CD workflows and agent instructions
  CONNECTION.md     ← KPI, chart, filter and API mapping reference
  README.md         ← This file
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
  features/
    Analytics/
      pages/AnalyticsPage.tsx
      hooks/useAnalytics.ts
      services/analyticsService.ts
      types/analytics.types.ts
      components/
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
      components/
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

All analytics values are filter-aware and computed server-side with the selected filters applied:

- `DateFilter` / `CustomFromDate` / `CustomToDate`
- `State`
- `Branch` (matched against `col_db.branches.name`)
- `Zone` (matched against `col_db.branches.zone_code`)

### KPI Formulas

All values are drawn from schema-qualified tables.

#### Total Outstanding Principal

- Table: `col_db.dpd_cases`
- Column: `outstanding_principal`
- Value: `SUM(outstanding_principal)` for cases where `loan_status IN ('closed','settled','resolved')`
- Subtitle: total `SUM(outstanding_principal)` across all filtered cases

#### Total Outstanding

- Table: `col_db.dpd_cases`
- Column: `total_outstanding`
- Value: `SUM(total_outstanding)` for closed/settled/resolved cases
- Subtitle: total `SUM(total_outstanding)` across all filtered cases

#### Total Delivered

- Table: `col_db.communication_logs`
- Column: `status`
- Value: `COUNT(*) WHERE status = 'delivered'`
- Subtitle: total communication rows in the filtered period

#### PTPs Honoured

- Table: `col_db.ptps`
- Column: `honoured`
- Value: `COUNT(*) WHERE honoured = true`
- Subtitle: total PTP rows in the filtered period

### Trend Logic

Each KPI compares the current filtered period against the previous period of the same length:

```text
trend % = ((current - previous) / previous) * 100
```

Trend direction: `up` if current > previous, `down` if current < previous, `neutral` if equal.

## API Endpoint Table

| Method | Endpoint | Purpose | Main source |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Full analytics payload | `AnalyticsRepository.GetDashboardAsync` |
| `GET` | `/api/analytics/kpi-cards` | KPI cards only | `GetKpiCardsAsync` |
| `GET` | `/api/analytics/radar` | Radar metrics | `GetRadarAsync` |
| `GET` | `/api/analytics/strategy-performance` | Strategy performance list | `GetStrategyPerformanceAsync` |
| `GET` | `/api/analytics/communication-performance` | Hourly communication stats | `GetCommunicationPerformanceAsync` |
| `GET` | `/api/analytics/channel-performance` | Product recovery split | `GetChannelPerformanceAsync` |
| `GET` | `/api/analytics/bucket-distribution` | DPD bucket distribution | `GetBucketDistributionAsync` |
| `GET` | `/api/reports/payments` | Payment records | `ReportsController.GetPayments` |
| `GET` | `/api/reports/communication_logs` | Communication logs | `ReportsController.GetCommunicationLogs` |
| `GET` | `/api/reports/strategies` | Strategies | `ReportsController.GetStrategies` |
| `GET` | `/api/reports/dpd-cases` | DPD cases | `ReportsController.GetDpdCases` |
| `GET` | `/api/reports/bounce-cases` | Bounce cases | `ReportsController.GetBounceCases` |
| `GET` | `/api/reports/pre-emi-cases` | Pre-EMI cases | `ReportsController.GetPreEmiCases` |
| `GET` | `/api/reports/ptps` | PTPs | `ReportsController.GetPtps` |
| `GET` | `/api/reports/branches` | Branch master data | `ReportsController.GetBranches` |

## Analytics Charts

### Performance Radar

File: [`Frontend/src/features/Analytics/components/PerformanceRadar.tsx`](Frontend/src/features/Analytics/components/PerformanceRadar.tsx)

Logic:
- `Contact Rate = delivered / total communications * 100`
- `PTP Success Rate = honoured PTPs / total PTPs * 100`
- `Collection Rate = successful payment amount / outstanding amount * 100`
- `Payment Success Rate = successful payments / total payments * 100`
- `Case Closure Rate = closed cases / total cases * 100`

### Strategy Effectiveness

File: [`Frontend/src/features/Analytics/components/StrategyEffectiveness.tsx`](Frontend/src/features/Analytics/components/StrategyEffectiveness.tsx)

Logic:
- Data source: `col_db.strategies` joined with `col_db.dpd_cases`
- Formula: `closed cases for strategy / total cases for strategy * 100`

### Strategy Gap Chart

File: [`Frontend/src/features/Analytics/components/StrategyGapChart.tsx`](Frontend/src/features/Analytics/components/StrategyGapChart.tsx)

Logic:
- Uses `strategyPerformance`
- `achieved = percentage`
- `target = dpd_range_to` (used as proxy target)
- `gap = max(target - achieved, 0)`

### Hourly Call Distribution

File: [`Frontend/src/features/Analytics/components/HourlyCallDistribution.tsx`](Frontend/src/features/Analytics/components/HourlyCallDistribution.tsx)

Logic:
- Table: `col_db.communication_logs`
- Grouped by hour of `created_on`
- `calls = COUNT(*)`, `responses = COUNT(*) WHERE status = 'delivered'`

### Communication Efficiency

File: [`Frontend/src/features/Analytics/components/CommunicationEfficiencyChart.tsx`](Frontend/src/features/Analytics/components/CommunicationEfficiencyChart.tsx)

Logic:
- Uses hourly communication dataset
- `deliveryRate = responses / calls * 100`

### Branch Contribution Chart

File: [`Frontend/src/features/Analytics/components/BranchContributionChart.tsx`](Frontend/src/features/Analytics/components/BranchContributionChart.tsx)

Logic:
- Table: `col_db.dpd_cases`
- Grouped by `branch_name`
- Measure: `SUM(total_outstanding)`

### Agent Contribution Treemap

File: [`Frontend/src/features/Analytics/components/AgentContributionChart.tsx`](Frontend/src/features/Analytics/components/AgentContributionChart.tsx)

Logic:
- Tables: `col_db.dpd_cases` + `col_db.ptps` + `auth.users`
- Agent identity resolved via `ptps.agent_id → auth.users.agent_id`
- `allocatedCases = COUNT(dpd_cases)`
- `resolvedCases = COUNT(cases WHERE loan_status IN ('closed','settled','resolved'))`
- `recoveredAmount = SUM(total_outstanding)` for resolved cases

### Portfolio Risk Distribution

File: [`Frontend/src/features/Analytics/components/ProductDistributionChart.tsx`](Frontend/src/features/Analytics/components/ProductDistributionChart.tsx)

Logic:
- Table: `col_db.dpd_cases`
- Grouped by `bucket` column

## Data Source → Formula → Chart Matrix

| Data source | Formula / logic | Chart / UI |
|---|---|---|
| `col_db.dpd_cases.outstanding_principal` | `SUM(outstanding_principal)` for closed cases vs all filtered | KPI: `Total Outstanding Principal` |
| `col_db.dpd_cases.total_outstanding` | `SUM(total_outstanding)` for closed cases vs all filtered | KPI: `Total Outstanding` |
| `col_db.communication_logs.status` | `COUNT(status='delivered') / total rows` | KPI: `Total Delivered` |
| `col_db.ptps.honoured` | `COUNT(honoured=true) / total rows` | KPI: `PTPs Honoured` |
| `col_db.communication_logs.created_on` | Group by hour; `calls=COUNT(*)`, `responses=delivered count` | `Hourly Call Distribution` |
| `col_db.communication_logs` + `col_db.ptps` + `col_db.payments` + `col_db.dpd_cases` | Rate formulas per metric | `Performance Radar` |
| `col_db.strategies` + `col_db.dpd_cases` | `closed cases / total cases * 100` | `Strategy Effectiveness` |
| `col_db.strategies` + `col_db.dpd_cases` | `achieved`, `target`, `gap = max(target - achieved, 0)` | `Strategy Gap Chart` |
| `col_db.dpd_cases.branch_name` | `SUM(total_outstanding)` grouped by branch | `Branch Contribution Chart` |
| `col_db.dpd_cases` + `col_db.ptps` + `auth.users` | `allocatedCases`, `resolvedCases`, `recoveredAmount` | `Agent Contribution Treemap` |
| `col_db.dpd_cases.bucket` | Grouped by bucket label | `Portfolio Risk Distribution` |
| `col_db.communication_logs` | `deliveryRate = delivered / sent * 100` | `Communication Efficiency` |

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

| Schema | Table | Description |
|---|---|---|
| `col_db` | `dpd_cases` | DPD loan case records with financials and status |
| `col_db` | `bounce_cases` | Bounce/NACH failure cases |
| `col_db` | `pre_emi_cases` | Pre-EMI pipeline cases |
| `col_db` | `strategies` | Recovery strategy definitions |
| `col_db` | `strategy_steps` | Step definitions per strategy |
| `col_db` | `strategy_approval_log` | Approval audit trail for strategies |
| `col_db` | `strategy_execution_log` | Execution log per case+strategy |
| `col_db` | `communication_logs` | All channel communications (SMS/WhatsApp/email) |
| `col_db` | `payments` | Payment records linked by `strategy_id` |
| `col_db` | `ptps` | Promise-To-Pay commitments |
| `col_db` | `branches` | Branch master with zone, region, state |
| `auth` | `users` | Agent identity (replaces old `col_db.agents`) |

## Local Setup

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- PostgreSQL 14+ running locally
  - Host: `localhost`, Port: `5432`
  - Database: `digital_collection_platform`
  - User/Password: `postgres`/`postgres`

### Backend

```bash
cd Backend
dotnet restore
dotnet run
# API available at http://localhost:5166
# Swagger at http://localhost:5166/swagger
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
# App available at http://localhost:5173
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
