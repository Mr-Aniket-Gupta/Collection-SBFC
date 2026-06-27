// App Router

import { createBrowserRouter, Navigate } from 'react-router-dom'
import DashboardLayout from '@/layout/DashboardLayout'
import { ReportsPage } from '@/features/reports'
import { AnalyticsPage } from '@/features/Analytics'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/analytics/dashboard" replace />,
      },
      {
        path: 'reports',
        element: <Navigate to="/reports/cases" replace />,
      },
      {
        path: 'reports/:tableKey',
        element: <ReportsPage />,
      },
      {
        path: 'analytics',
        element: <Navigate to="/analytics/dashboard" replace />,
      },
      {
        path: 'analytics/dashboard',
        element: <AnalyticsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/analytics/dashboard" replace />,
      },
    ],
  },
])
