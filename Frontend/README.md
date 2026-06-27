# CollectIQ Frontend (Reports & Analytics Dashboard)

This repository contains the frontend for the **CollectIQ Reports & Analytics Dashboard**.

## Tech stack
- React + TypeScript
- Vite (dev server + build)
- React Router (`react-router-dom`)
- TanStack React Query (`@tanstack/react-query`)
- Recharts (charts)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Sonner (toasts)
- XSLX (Excel export)

## Local development
### 1) Install dependencies
```bash
cd Frontend
npm install
```

### 2) Start dev server
```bash
npm run dev
```
Then open the URL shown in the terminal (typically `http://localhost:5173`).

## Build & lint
### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Preview production build
```bash
npm run preview
```

## Project structure (high level)
```text
src/
  app/
    main.tsx           # React mount + global styles
    App.tsx            # QueryClient + RouterProvider
    routes.tsx         # App routes

  layout/
    DashboardLayout.tsx
    Header/
    Sidebar/

  features/
    reports/
      pages/ReportsPage.tsx
      charts/
      components/
      hooks/
      services/
      utils/
      types/
      data/

    Analytics/
      pages/AnalyticsPage.tsx
      charts/
      hooks/
      data/
      types/

  Components/
    (shared UI building blocks)

  styles/
    index.css           # Tailwind entry + custom variables
```

## Routing
`src/app/routes.tsx` defines the app router:
- `/` redirects to `/analytics`
- `/reports` renders `ReportsPage`
- `/analytics` renders `AnalyticsPage`

All routes are rendered inside `DashboardLayout`, which provides:
- persistent sidebar
- persistent header
- scrollable main content via `<Outlet />`

## State & data fetching
- `src/app/App.tsx` creates a `QueryClient` with default options.
- Feature hooks (see `src/features/**/hooks`) are expected to use React Query for:
  - fetching report lists
  - fetching metrics for charts/KPIs

## Charts & Excel export
- Charts are implemented with **Recharts** inside:
  - `src/features/reports/charts/*`
  - `src/features/Analytics/charts/*`
- Excel export uses **XLSX** utilities in:
  - `src/features/reports/utils/excelExport.ts`

## Styling
- Tailwind CSS v4 is wired in `src/styles/index.css`.
- Theme colors are referenced via CSS variables (e.g. `--color-ice`, `--color-navy`) used in layout classes.

## Adding/changing reports (reports feature)
Core flow lives under `src/features/reports/`:
- `pages/ReportsPage.tsx`: composes the UI sections (filters, KPI cards, charts, table)
- `services/reportsService.ts`: data operations (currently mock-based)
- `hooks/useReports.ts` & `hooks/useReportMetrics.ts`: query hooks
- `data/mockData.ts`: mock dataset

When adding a new chart/table component:
1. Put UI under the closest folder (`charts/` or `components/`).
2. If it needs data, add/extend a hook in `hooks/`.
3. If mock data requires updates, update `data/mockData.ts`.

## Common commands
```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Notes for next developer
- Prefer using absolute imports via `@/` (configured in `vite.config.ts`).
- Keep feature code isolated inside `src/features/<name>/`.
- UI layout chrome (Sidebar/Header/DashboardLayout) should remain in `src/layout/`.
- If you adjust routes, update `src/app/routes.tsx` and ensure nav items in `src/layout/Sidebar/` stay consistent.

