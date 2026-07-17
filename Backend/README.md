# Backend — SBFC DCSP API

ASP.NET Core Web API (.NET 8) serving the Digital Collection Strategy Platform dashboard.

---

## Technology Stack

- **Runtime**: .NET 8
- **Framework**: ASP.NET Core Web API
- **Database**: PostgreSQL via Npgsql
- **Documentation**: Swagger / OpenAPI
- **Architecture**: Clean Architecture + Repository Pattern + DTO Pattern

---

## Prerequisites

- .NET 8 SDK
- PostgreSQL 14+ running locally

**Connection string** (`appsettings.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=digital_collection_platform;Username=postgres;Password=postgres"
  }
}
```

---

## Running Locally

```bash
cd Backend
dotnet restore
dotnet run
```

- API: `http://localhost:5166`
- Swagger: `http://localhost:5166/swagger`

---

## Folder Structure

```text
Backend/
├── Common/
│   ├── Controllers/
│   │   └── ApiControllerBase.cs      # Shared ExecuteAsync wrapper
│   └── Dtos/
│       └── PagedResult.cs            # Generic pagination DTO
│
├── Database/
│   ├── IDbConnectionFactory.cs
│   ├── NpgsqlConnectionFactory.cs
│   └── NpgsqlExtensions.cs          # AddNullableText, AddDateRange helpers
│
├── Middleware/
│   └── ExceptionMiddleware.cs        # Global error handling
│
├── Modules/
│   ├── Analytics/
│   │   ├── Config/
│   │   │   └── AnalyticsModule.cs    # DI registration
│   │   ├── Controllers/
│   │   │   └── AnalyticsController.cs
│   │   ├── DTOs/
│   │   │   └── AnalyticsDtos.cs
│   │   ├── Repositories/
│   │   │   └── AnalyticsRepository.cs  # All analytics SQL
│   │   ├── Requests/
│   │   │   └── AnalyticsQueryRequest.cs
│   │   └── Services/
│   │       └── AnalyticsService.cs
│   │
│   └── Reports/
│       ├── Config/
│       │   └── ReportsModule.cs
│       ├── Controllers/
│       │   └── ReportsController.cs
│       ├── DTOs/
│       │   └── ReportsDtos.cs
│       ├── Repositories/
│       │   └── DcspQueryRepository.cs  # Generic paginated table reader
│       └── Services/
│           └── ReportsService.cs
│
└── Program.cs                         # App bootstrap
```

---

## API Endpoints

### Analytics (`/api/analytics/...`)

All endpoints accept query parameters: `state`, `branch_name`, `zone`, `start_date`, `end_date`, `limit`.

| Endpoint                                       | Description                             |
| ---------------------------------------------- | --------------------------------------- |
| `GET /api/analytics/dashboard`                 | Full dashboard payload (parallel fetch) |
| `GET /api/analytics/kpi-cards`                 | 4 KPI summary cards                     |
| `GET /api/analytics/radar`                     | 6 performance radar metrics             |
| `GET /api/analytics/strategy-performance`      | Strategy closure rate list              |
| `GET /api/analytics/communication-performance` | Hourly calls vs delivered               |
| `GET /api/analytics/channel-performance`       | Product-level recovery %                |
| `GET /api/analytics/bucket-distribution`       | DPD bucket case counts                  |
| `GET /api/analytics/branch-contributors`       | Branch outstanding totals               |
| `GET /api/analytics/agent-contributors`        | Agent resolution stats                  |

### Reports (`/api/reports/...`)

All endpoints accept query parameters: `page` (default 1), `limit` (default 25, max 200).

| Endpoint                                  | DB Table                        |
| ----------------------------------------- | ------------------------------- |
| `GET /api/reports/payments`               | `col_db.payments`               |
| `GET /api/reports/communication_logs`     | `col_db.communication_logs`     |
| `GET /api/reports/strategies`             | `col_db.strategies`             |
| `GET /api/reports/strategy-approval-log`  | `col_db.strategy_approval_log`  |
| `GET /api/reports/strategy-steps`         | `col_db.strategy_steps`         |
| `GET /api/reports/strategy-execution-log` | `col_db.strategy_execution_log` |
| `GET /api/reports/pre-emi-cases`          | `col_db.pre_emi_cases`          |
| `GET /api/reports/dpd-cases`              | `col_db.dpd_cases`              |
| `GET /api/reports/bounce-cases`           | `col_db.bounce_cases`           |
| `GET /api/reports/ptps`                   | `col_db.ptps`                   |
| `GET /api/reports/branches`               | `col_db.branches`               |

---

## Response Format

All responses follow this envelope:

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {},
  "timestamp": "2026-01-01T00:00:00"
}
```

Error responses include an `errors` array. HTTP 4xx/5xx status codes are set appropriately.

---

## Architecture Notes

- **Controllers** are thin — they only call `ExecuteAsync()` from `ApiControllerBase`.
- **Services** delegate directly to repositories without adding business logic for report tables.
- **AnalyticsRepository** runs all 8 dashboard queries in parallel via `Task.WhenAll`.
- **DcspQueryRepository** uses a static `Tables` dictionary to map public report names to physical schema-qualified table names.
- SQL queries always use `col_db.` schema prefix to avoid `42P01` relation-not-found errors.
- The `agents` table is removed. Agent data is resolved from `auth.users` via `ptps.agent_id`.
- `communication_logs` uses `created_on` and `status_updated_on` (not `created_at`).
- Reports and analytics responses now resolve communication display labels through `col_db.channel_master` using `channel_code` → `channel_name`, while keeping the raw `channel` code available internally for filtering and joins.

---

## Database Schema Overview

| Schema   | Table                    | Description                               |
| -------- | ------------------------ | ----------------------------------------- |
| `col_db` | `dpd_cases`              | DPD loan cases with financials and status |
| `col_db` | `bounce_cases`           | NACH/bounce cases                         |
| `col_db` | `pre_emi_cases`          | Pre-EMI pipeline cases                    |
| `col_db` | `strategies`             | Collection strategy definitions           |
| `col_db` | `strategy_steps`         | Step config per strategy                  |
| `col_db` | `strategy_approval_log`  | Approval workflow history                 |
| `col_db` | `strategy_execution_log` | Strategy execution per case               |
| `col_db` | `communication_logs`     | SMS/WhatsApp/email communication records  |
| `col_db` | `payments`               | Payment records (linked by `strategy_id`) |
| `col_db` | `ptps`                   | Promise-To-Pay commitments                |
| `col_db` | `branches`               | Branch master (zone, region, state)       |
| `auth`   | `users`                  | Agent identity and account records        |
