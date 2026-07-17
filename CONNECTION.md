# CONNECTION.md — SBFC DCSP Platform

This file is the single source of truth for how the database, backend, and frontend connect.  
Use it to trace any KPI, chart, filter, or table from its raw database row to its rendered UI element.

---

Schemas:

| Schema   | Purpose                      |
| -------- | ---------------------------- |
| `auth`   | User accounts, agents, roles |
| `col_db` | All collection domain tables |

---

## Filter Architecture

### How Filters Work

All filters are applied **server-side in every repository query**.  
Filters are propagated as nullable query parameters from the frontend.

| Filter     | Frontend state   | Backend param  | DB column                      |
| ---------- | ---------------- | -------------- | ------------------------------ |
| State      | `stateFilter`    | `@state`       | `col_db.dpd_cases.state`       |
| Branch     | `branchFilter`   | `@branch_name` | `col_db.dpd_cases.branch_name` |
| Zone       | `zoneFilter`     | `@zone`        | `col_db.branches.zone_code`    |
| Start Date | `customFromDate` | `@start_date`  | table-specific date column     |
| End Date   | `customToDate`   | `@end_date`    | table-specific date column     |

> **Important**: Branch and zone are resolved through a JOIN against `col_db.branches`.  
> Zone is **never** stored directly on `dpd_cases`; it is always derived from the branch lookup.

### Filter Option Sources (Dynamic — No Hardcoding)

| Filter dropdown | Source function          | Source table                |
| --------------- | ------------------------ | --------------------------- |
| Branch list     | `extractBranchOptions()` | `col_db.branches.name`      |
| Zone list       | `extractZoneOptions()`   | `col_db.branches.zone_code` |
| State list      | `extractStateOptions()`  | `col_db.branches.state`     |

These are loaded into the frontend via the `reportTableBundle` query which fetches `branches` alongside all other report tables.

---

## KPI Mapping

| KPI Card                    | DB Table                    | Column(s)               | Formula                                                     |
| --------------------------- | --------------------------- | ----------------------- | ----------------------------------------------------------- |
| Total Outstanding Principal | `col_db.dpd_cases`          | `outstanding_principal` | `SUM(outstanding_principal)` for closed cases / total cases |
| Total Outstanding           | `col_db.dpd_cases`          | `total_outstanding`     | `SUM(total_outstanding)` for closed cases / total cases     |
| Total Delivered             | `col_db.communication_logs` | `status`                | `COUNT(*) WHERE status='delivered'` / total rows            |
| PTPs Honoured               | `col_db.ptps`               | `honoured`              | `COUNT(*) WHERE honoured=true` / total rows                 |

**Trend**: Each KPI compares the current period to the previous period of the same duration.  
`trend% = ((current - previous) / previous) * 100`

---

## Chart Mapping

### Analytics Page (`/analytics/dashboard`)

| Chart                    | DB Source                                                      | Backend Function                   | Frontend Component                      |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| KPI Cards                | `col_db.dpd_cases`, `col_db.communication_logs`, `col_db.ptps` | `GetKpiCardsAsync`                 | `KPICard.tsx`                           |
| Performance Radar        | All analytics tables                                           | `GetRadarAsync`                    | `PerformanceRadar.tsx`                  |
| Strategy Effectiveness   | `col_db.strategies` + `col_db.dpd_cases`                       | `GetStrategyPerformanceAsync`      | `StrategyEffectiveness.tsx`             |
| Strategy Gap Chart       | `col_db.strategies` + `col_db.dpd_cases`                       | `GetStrategyPerformanceAsync`      | `StrategyGapChart.tsx`                  |
| Hourly Call Distribution | `col_db.communication_logs` (grouped by `created_on` hour)     | `GetCommunicationPerformanceAsync` | `HourlyCallDistribution.tsx`            |
| Communication Efficiency | `col_db.communication_logs`                                    | `GetCommunicationPerformanceAsync` | `CommunicationEfficiencyChart.tsx`      |
| Product Recovery Split   | `col_db.dpd_cases` + `col_db.payments`                         | `GetChannelPerformanceAsync`       | `ProductDistributionChart.tsx`          |
| Bucket Distribution      | `col_db.dpd_cases` (grouped by `bucket`)                       | `GetBucketDistributionAsync`       | `ProductDistributionChart.tsx` (reused) |
| Branch Contribution      | `col_db.dpd_cases` (grouped by `branch_name`)                  | `GetBranchContributorsAsync`       | `BranchContributionChart.tsx`           |
| Agent Contribution       | `col_db.dpd_cases` + `col_db.ptps` + `auth.users`              | `GetAgentContributorsAsync`        | `AgentContributionChart.tsx`            |

### Reports Page (`/reports/:tableKey`)

| Chart                  | Data source                    | Frontend Component              |
| ---------------------- | ------------------------------ | ------------------------------- |
| Payment Volume Trend   | `payments` in bundle           | `PaymentVolumeTrendChart.tsx`   |
| Active Cases by Branch | `dpd-cases` in bundle          | `ActiveCasesByBranchChart.tsx`  |
| Communication Funnel   | `communication_logs` in bundle | `CommunicationFunnelChart.tsx`  |
| Channel Conversion     | `payments` in bundle           | `ChannelConversionChart.tsx`    |
| Bucket-wise Trend      | `dpd-cases` in bundle          | `BucketWiseTrendChart.tsx`      |
| Collection Trend       | `payments` in bundle           | `CollectionTrendChart.tsx`      |
| Recovery Distribution  | `payments` in bundle           | `RecoveryDistributionChart.tsx` |

---

## Table Mapping

### Analytics Tables

| Table                | Schema   | Used by                              |
| -------------------- | -------- | ------------------------------------ |
| `dpd_cases`          | `col_db` | KPIs, radar, strategy, branch, agent |
| `communication_logs` | `col_db` | KPIs, radar, hourly comms chart      |
| `ptps`               | `col_db` | KPIs, radar, agent contributors      |
| `strategies`         | `col_db` | Strategy performance, gap chart      |
| `payments`           | `col_db` | Collection rate, channel chart       |
| `branches`           | `col_db` | Zone filter JOIN                     |
| `users`              | `auth`   | Agent names in contributor chart     |

### Reports Tables (Browsable via `/api/reports/*`)

| Frontend key             | API endpoint                          | DB table                        |
| ------------------------ | ------------------------------------- | ------------------------------- |
| `dpd-cases`              | `/api/reports/dpd-cases`              | `col_db.dpd_cases`              |
| `bounce-cases`           | `/api/reports/bounce-cases`           | `col_db.bounce_cases`           |
| `pre-emi-cases`          | `/api/reports/pre-emi-cases`          | `col_db.pre_emi_cases`          |
| `payments`               | `/api/reports/payments`               | `col_db.payments`               |
| `communication_logs`     | `/api/reports/communication_logs`     | `col_db.communication_logs`     |
| `strategies`             | `/api/reports/strategies`             | `col_db.strategies`             |
| `strategy-approval-log`  | `/api/reports/strategy-approval-log`  | `col_db.strategy_approval_log`  |
| `strategy-steps`         | `/api/reports/strategy-steps`         | `col_db.strategy_steps`         |
| `strategy-execution-log` | `/api/reports/strategy-execution-log` | `col_db.strategy_execution_log` |
| `ptps`                   | `/api/reports/ptps`                   | `col_db.ptps`                   |
| `branches`               | `/api/reports/branches`               | `col_db.branches`               |

---

## Data Flow Architecture

```
User selects a filter (Branch / Zone / State / Date)
  │
  ▼
Frontend filter state updates
  │
  ├─► reportFilterEngine.ts: filterBundleByDateRange() → filterBundleByBranchZone()
  │     (for Reports page — filters the in-memory bundle)
  │
  └─► useAnalytics.ts: triggers API refetch with updated query params
        │
        ▼
      analyticsService.ts: GET /api/analytics/dashboard?state=...&branch_name=...&zone=...
        │
        ▼
      AnalyticsController → AnalyticsService → AnalyticsRepository
        │
        ▼
      PostgreSQL: WHERE @state IS NULL OR c.state = @state
                  AND @branch_name IS NULL OR ... (JOIN col_db.branches for zone)
        │
        ▼
      DTOs returned as JSON
        │
        ▼
      Frontend re-renders KPI cards, charts, and tables
```

---

## API Endpoints Summary

### Analytics

| Method | Endpoint                                   | Controller Method             | Repository Method                  |
| ------ | ------------------------------------------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/analytics/dashboard`                 | `GetDashboard`                | `GetDashboardAsync` (parallel)     |
| GET    | `/api/analytics/kpi-cards`                 | `GetKpiCards`                 | `GetKpiCardsAsync`                 |
| GET    | `/api/analytics/radar`                     | `GetRadar`                    | `GetRadarAsync`                    |
| GET    | `/api/analytics/strategy-performance`      | `GetStrategyPerformance`      | `GetStrategyPerformanceAsync`      |
| GET    | `/api/analytics/communication-performance` | `GetCommunicationPerformance` | `GetCommunicationPerformanceAsync` |
| GET    | `/api/analytics/channel-performance`       | `GetChannelPerformance`       | `GetChannelPerformanceAsync`       |
| GET    | `/api/analytics/bucket-distribution`       | `GetBucketDistribution`       | `GetBucketDistributionAsync`       |
| GET    | `/api/analytics/branch-contributors`       | `GetBranchContributors`       | `GetBranchContributorsAsync`       |
| GET    | `/api/analytics/agent-contributors`        | `GetAgentContributors`        | `GetAgentContributorsAsync`        |

### Reports (all paginated, query params: `page`, `limit`)

| Method | Endpoint                              | Service Method                 |
| ------ | ------------------------------------- | ------------------------------ |
| GET    | `/api/reports/payments`               | `GetPaymentsAsync`             |
| GET    | `/api/reports/communication_logs`     | `GetCommunicationLogsAsync`    |
| GET    | `/api/reports/strategies`             | `GetStrategiesAsync`           |
| GET    | `/api/reports/strategy-approval-log`  | `GetStrategyApprovalLogAsync`  |
| GET    | `/api/reports/strategy-steps`         | `GetStrategyStepsAsync`        |
| GET    | `/api/reports/strategy-execution-log` | `GetStrategyExecutionLogAsync` |
| GET    | `/api/reports/pre-emi-cases`          | `GetPreEmiCasesAsync`          |
| GET    | `/api/reports/dpd-cases`              | `GetDpdCasesAsync`             |
| GET    | `/api/reports/bounce-cases`           | `GetBounceCasesAsync`          |
| GET    | `/api/reports/ptps`                   | `GetPtpsAsync`                 |
| GET    | `/api/reports/branches`               | `GetBranchesAsync`             |

---

## Key Schema Notes

- `col_db.communication_logs` uses `created_on` and `status_updated_on` (not `created_at` or `sent_at`).
- `col_db.communication_logs` links to cases via `strategy_id` and `case_id` — **not a direct loan number join**.
- `col_db.payments` and `col_db.ptps` link to cases via `strategy_id` only — **no case_id column**.
- Agents are stored in `auth.users` (column: `agent_id`, `agent_name`). There is no `col_db.agents` table.
- Branch resolution for zone filter requires a JOIN: `col_db.branches ON lower(trim(b.name)) = lower(trim(c.branch_name))`.
