# Implementation Plan - Reports & Analytics Dashboard (CollectIQ)

This implementation plan details the setup and execution details for constructing the **CollectIQ Reports & Analytics Dashboard**. It strictly follows the requested folder structure, modular rules, and design guidelines.

## User Review Required

> [!IMPORTANT]
> **Dependencies**: The project requires additional packages (`react-router-dom`, `@tanstack/react-query`, `recharts`, `lucide-react`, `sonner`, `xlsx`, `tailwindcss`, `@tailwindcss/vite`, `typescript`). I will install these package dependencies.
> **TypeScript Transition**: The current project template uses JavaScript. I will migrate the template to TypeScript by adding `tsconfig.json`, updating the file extensions to `.ts`/`.tsx`, and configuring path aliasing (`@/*` mapping to `src/*`) in both TSConfig and Vite config.
> **Tailwind CSS v4 Configuration**: We will configure Vite using the new `@tailwindcss/vite` plugin and `@import "tailwindcss";` in `src/styles/index.css`.

---

## Proposed Changes

### 1. Build and TypeScript Configuration

Configure TypeScript and Tailwind v4 for compilation and absolute import alias mapping (`@/*` -> `src/*`).

#### [MODIFY] [package.json](file:///d:/Aniket%20Data/SBFC/Frontend/package.json)
- Add standard dependencies: `react-router-dom`, `@tanstack/react-query`, `recharts`, `lucide-react`, `sonner`, `xlsx`.
- Add devDependencies: `tailwindcss`, `@tailwindcss/vite`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.

#### [NEW] [vite.config.ts](file:///d:/Aniket%20Data/SBFC/Frontend/vite.config.ts)
- Rename `vite.config.js` to `vite.config.ts`.
- Integrate `@tailwindcss/vite` plugin.
- Configure path alias mapping for `@` pointing to `src`.

#### [DELETE] [vite.config.js](file:///d:/Aniket%20Data/SBFC/Frontend/vite.config.js)

#### [NEW] [tsconfig.json](file:///d:/Aniket%20Data/SBFC/Frontend/tsconfig.json)
- Configure root TypeScript configurations.

#### [NEW] [tsconfig.app.json](file:///d:/Aniket%20Data/SBFC/Frontend/tsconfig.app.json)
- App TypeScript options, enabling path aliases and browser DOM types.

#### [NEW] [tsconfig.node.json](file:///d:/Aniket%20Data/SBFC/Frontend/tsconfig.node.json)
- Vite configuration TypeScript settings.

#### [NEW] [src/vite-env.d.ts](file:///d:/Aniket%20Data/SBFC/Frontend/src/vite-env.d.ts)
- Vite client typings.

#### [MODIFY] [index.html](file:///d:/Aniket%20Data/SBFC/Frontend/index.html)
- Update target script from `/src/main.jsx` to `/src/app/main.tsx`.

---

### 2. Styles and Asset Cleanup

#### [DELETE] [src/main.jsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/main.jsx)
#### [DELETE] [src/App.jsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/App.jsx)
#### [DELETE] [src/App.css](file:///d:/Aniket%20Data/SBFC/Frontend/src/App.css)
#### [DELETE] [src/index.css](file:///d:/Aniket%20Data/SBFC/Frontend/src/index.css)

#### [NEW] [src/styles/index.css](file:///d:/Aniket%20Data/SBFC/Frontend/src/styles/index.css)
- Implement Tailwind CSS v4 via `@import "tailwindcss";` and declare custom font face or CSS variables (e.g., color styles for dark theme sidebar and cards).

---

### 3. Application Core (`src/app/`)

Implement routes, React router config, React QueryClient setup, and application bootstrap.

#### [NEW] [src/app/main.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/app/main.tsx)
- Bootstraps the application, mounts components under `StrictMode`.
- Imports `src/styles/index.css`.

#### [NEW] [src/app/App.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/app/App.tsx)
- Instantiates `QueryClient` and wraps the application in `QueryClientProvider` and `RouterProvider`.
- Includes the `Toaster` component for UI alerts.

#### [NEW] [src/app/routes.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/app/routes.tsx)
- Defines routing rules:
  - `/` redirects to `/reports`.
  - Nested routes under `/` use `DashboardLayout`.
  - Route `/reports` points to the `ReportsPage` feature component.

---

### 4. Layout Architecture (`src/layout/`)

Create the persistent header and sidebar navigation layout.

#### [NEW] [src/layout/DashboardLayout.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/DashboardLayout.tsx)
- Grid layout with sidebar, header, and primary scrollable content panel utilizing `<Outlet />`.

#### [NEW] [src/layout/Header/Header.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Header/Header.tsx)
- Render the page header with dynamic page titles, date filter dropdown, notification action, and user info panel.

#### [NEW] [src/layout/Header/SearchBar.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Header/SearchBar.tsx)
- Reusable top search bar component.

#### [NEW] [src/layout/Header/UserMenu.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Header/UserMenu.tsx)
- Avatar and details of the current logged-in user.

#### [NEW] [src/layout/Header/index.ts](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Header/index.ts)
- Barrel exports.

#### [NEW] [src/layout/Sidebar/Sidebar.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Sidebar/Sidebar.tsx)
- Sidebar vertical menu panel showing CollectIQ logo, menu items (Dashboard, Case Management, Approvals, Reports, etc.), and administrator avatar footer.

#### [NEW] [src/layout/Sidebar/SidebarItem.tsx](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Sidebar/SidebarItem.tsx)
- Individual nav item rendering support for active highlights and icons.

#### [NEW] [src/layout/Sidebar/index.ts](file:///d:/Aniket%20Data/SBFC/Frontend/src/layout/Sidebar/index.ts)
- Barrel exports.

---

### 5. Reports Feature Architecture (`src/features/reports/`)

The reports module is fully isolated and portable inside `src/features/reports/`.

```
src/features/reports/
├── pages/
│   └── ReportsPage.tsx
├── components/
│   ├── category/
│   │   ├── CategoryCard.tsx
│   │   ├── CategorySelector.tsx
│   │   └── index.ts
│   ├── kpi/
│   │   ├── KpiCard.tsx
│   │   ├── KpiGrid.tsx
│   │   └── index.ts
│   ├── filters/
│   │   ├── FilterBar.tsx
│   │   └── index.ts
│   ├── tabs/
│   │   ├── TabSelector.tsx
│   │   └── index.ts
│   ├── toolbar/
│   │   ├── Toolbar.tsx
│   │   └── index.ts
│   ├── table/
│   │   ├── ReportTable.tsx
│   │   ├── RowModal.tsx
│   │   └── index.ts
│   └── common/
│       └── index.ts
├── charts/
│   ├── ChannelConversionChart.tsx
│   ├── BucketWiseTrendChart.tsx
│   ├── CollectionTrendChart.tsx
│   ├── RecoveryDistributionChart.tsx
│   └── index.ts
├── hooks/
│   ├── useReports.ts
│   └── useReportMetrics.ts
├── services/
│   └── reportsService.ts
├── data/
│   └── mockData.ts
├── constants/
│   └── index.ts
├── utils/
│   ├── formatters.ts
│   └── excelExport.ts
├── types/
│   └── index.ts
├── assets/
│   └── index.ts
├── styles/
│   └── index.ts
└── index.ts
```

#### Detailed Feature Sub-Module Design:

*   **`types/index.ts`**: Contains types for:
    *   `ReportCategory` ('recovery' | 'bucket' | 'digital' | 'payment' | 'strategy' | 'communication' | 'bounce')
    *   `ReportStatus` ('Scheduled' | 'Ready' | 'Failed')
    *   `ReportItem` (id, name, description, category, createdBy, createdDate, status, sqlQuery, recordCount, fileSize, cronExpression)
    *   `MetricSummary` (totalCollection, totalCollectionTrend, digitalCollection, digitalCollectionTrend, resolutionRate, resolutionRateTrend, casesResolved, casesResolvedTrend)
    *   `ChartData` objects (conversion rate, DPD movement, monthly collection vs target, recovery share)
*   **`constants/index.ts`**:
    *   Static UI mapping definitions (colors, Category configuration maps, icon associations, static config values).
*   **`data/mockData.ts`**:
    *   A rich catalog of 24 realistic report items matching the categories (Recovery MIS, Bucket-wise MIS, Digital Recovery, etc.).
    *   Trend logs over 6 months (Aug-Jan) for charts.
    *   Conversion details for SMS, WhatsApp, AI Call, Manual Call, Email, Field.
*   **`services/reportsService.ts`**:
    *   Mock API methods with simulated network latency:
        *   `fetchReports(filters: { category?, status?, search?, page, limit, sortBy, sortOrder })`
        *   `fetchMetrics(category?: string)`
        *   `getReportById(id: string)`
*   **`hooks/`**:
    *   `useReports`: React Query query hooks returning filters, pagination state, and sorted lists.
    *   `useReportMetrics`: React Query query hooks returning KPI figures and chart contents depending on the active category.
*   **`utils/`**:
    *   `formatters.ts`: Helper methods for currency formatting (`INR Cr` / `INR Lakhs`), commas, percentages, and standard date strings.
    *   `excelExport.ts`: Generates a spreadsheets download via `XLSX` using raw grid data.
*   **`charts/`**:
    *   `ChannelConversionChart.tsx`: A Recharts horizontal bar chart (Sent, Responded, Converted per channel).
    *   `BucketWiseTrendChart.tsx`: A Recharts area chart showing stacked DPD bands (0-30, 31-60, 61-90, 91-120, 120+).
    *   `CollectionTrendChart.tsx`: A Recharts line chart showing collection vs target.
    *   `RecoveryDistributionChart.tsx`: A Recharts donut chart detailing Recovery Distribution shares.
*   **`components/`**:
    *   `category/CategoryCard.tsx` / `CategorySelector.tsx`: Grid of category items allowing filter selections.
    *   `kpi/KpiCard.tsx` / `KpiGrid.tsx`: Grid of metric items displaying absolute numbers and delta indicators.
    *   `tabs/TabSelector.tsx`: Top subheader page navigation tabs (Overview, Detailed Reports, Trends, Funnel Analysis).
    *   `toolbar/Toolbar.tsx`: Layout-aligned action bar containing Print, Share, and Export triggers.
    *   `table/ReportTable.tsx`: Full-featured data table handling pagination limits, sorting headers, and multi-state indicators.
    *   `table/RowModal.tsx`: Visual overlay modal displaying report configuration, scheduling details, preview sample columns, and generated query descriptions when eye action is clicked.
*   **`pages/ReportsPage.tsx`**:
    *   Master orchestration container coordinating layout panels, chart sections, tables, filter state context, and loaders.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm zero TypeScript compilation errors.
- Run `npm run lint` to verify adherence to style rules.

### Manual Verification
- Test all filter types (search text, report category clicking, status selecting) and ensure table rows correctly reload.
- Verify sorting on table columns (Report Name, Category, Created By, Created Date, Status).
- Click the eye icon to verify report details open in the Row Modal properly.
- Click the download action/button to verify file generation downloads standard spreadsheet files.
- Test responsive view resizing.
