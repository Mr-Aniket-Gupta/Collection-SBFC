# SBFC Finance Ltd - AI Development Agent Instructions

## Project Overview

This project is an enterprise-grade Digital Collection Strategy Platform (DCSP) for NBFCs and Banks.

The platform aims to:

- Maximize digital recovery rates.
- Minimize manual collection operations.
- Automate collection workflows.
- Provide real-time analytics and reporting.
- Support AI and ML driven predictions.
- Support future multi-tenant architecture.

The project follows strict Clean Architecture and feature-based modular development.

---

# Technology Stack

## Frontend

- React.js
- TypeScript
- React Router
- Axios
- Recharts
- Modular Feature Architecture

## Backend

- ASP.NET Core Web API (.NET)
- Clean Architecture
- Dependency Injection
- Repository Pattern
- DTO Pattern

## Database

- PostgreSQL

## Machine Learning

- Python
- Scikit-learn
- XGBoost
- Pandas
- FastAPI for model serving

---

# Repository Structure

```text
SBFC/
│
├── Backend/
│
├── Frontend/
│
├── ML/
│
├── Data/
│
└── Docs/
```

---

# Backend Rules

## Folder Structure

```text
Backend/
│
├── Common/
│
├── Database/
│
├── Middleware/
│
├── Modules/
│   │
│   ├── Analytics/
│   │   ├── Config/
│   │   ├── Controllers/
│   │   ├── DTOs/
│   │   ├── Requests/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   └── Mappings/
│   │
│   ├── Reports/
│   │
│   ├── Collection/
│   │
│   ├── Dashboard/
│   │
│   ├── Branch/
│   │
│   ├── Recovery/
│   │
│   └── MLAnalytics/
│
└── Program.cs
```

---

## Backend Development Standards

### Controllers

- Controllers must remain thin.
- No business logic in controllers.
- Controllers only validate requests and call services.

### Services

- All business logic must reside in services.
- Services should be stateless.
- Services should return DTOs only.

### Repositories

- Repositories must only interact with PostgreSQL.
- No business logic inside repositories.

### DTOs

- Never expose entities directly to frontend.
- Always use Request DTOs and Response DTOs.

### APIs

Every API must support:

- Filtering
- Sorting
- Pagination
- Search

Response format:

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {},
  "errors": [],
  "timestamp": "2026-01-01T00:00:00"
}
```

---

# Frontend Rules

## Folder Structure

```text
Frontend/src/
│
├── app/
├── layouts/
├── hooks/
├── components/
├── constants/
├── assets/
├── utils/
├── services/
│
└── features/
    │
    ├── analytics/
    ├── dashboard/
    ├── reports/
    ├── branches/
    ├── collection/
    ├── recovery/
    └── mlAnalytics/
```

---

## Frontend Standards

- Use TypeScript interfaces for all API responses.
- Keep pages thin.
- Business logic must remain inside hooks and services.
- Components must be reusable.
- Avoid prop drilling.
- Prefer composition over inheritance.
- Use feature-based architecture.

---

## API Service Layer

Example:

```text
features/dashboard/services/dashboardService.ts
```

Responsibilities:

- Axios calls only.
- No transformation logic.

---

## Hooks

Example:

```text
features/dashboard/hooks/useDashboard.ts
```

Responsibilities:

- Data fetching
- State management
- Loading state
- Error handling

---

# Database Rules

- PostgreSQL only.
- Use UUID primary keys when possible.
- Use indexes on filtering columns.
- Use foreign keys properly.
- Never use SELECT * in production queries.

---

# Query Standards

Every dashboard query must support:

- Region filter
- Zone filter
- State filter
- Branch filter
- Product filter
- Bucket filter
- DPD filter
- Date range filter

All charts and KPIs must react to filter changes.

---

# Dashboard Rules

KPIs, charts and tables must always remain connected.

Example:

Branch Filter
    ↓
KPI Cards
    ↓
Charts
    ↓
Tables

Changing any filter must refresh all dependent components.

---

# Machine Learning Rules

ML models must support:

- Recovery Prediction
- Digital Collection Prediction
- Branch Performance Prediction
- Bucket Migration Prediction
- Promise To Pay Prediction
- Collection Efficiency Prediction
- Agent Performance Prediction

Frontend must show:

- Actual vs Predicted
- Confidence Score
- Trend Analysis
- Feature Importance

---

# Code Quality Rules

- Follow SOLID principles.
- Follow Clean Code principles.
- Avoid duplicate code.
- Add comments above complex functions.
- Use meaningful naming conventions.
- Keep modules independent.

---

# Documentation Rules

Whenever code changes:

Update:

- Backend README
- Frontend README
- CONNECTION.md
- API documentation

---

# Testing Rules

Backend:

- Unit tests required.
- Service layer coverage mandatory.

Frontend:

- Component tests preferred.
- Hook tests preferred.

---

# Forbidden Practices

Never:

- Put business logic in controllers.
- Expose entities directly.
- Use hardcoded URLs.
- Use inline SQL in controllers.
- Use duplicate code.
- Ignore error handling.
- Ignore loading states.
- Ignore pagination for large datasets.

---

# AI Agent Behaviour

When generating code:

- Always follow project folder structure.
- Generate production-ready code.
- Follow clean architecture.
- Prefer reusable solutions.
- Keep frontend and backend loosely coupled.
- Maintain scalability and maintainability.
- Generate enterprise-grade implementations only.