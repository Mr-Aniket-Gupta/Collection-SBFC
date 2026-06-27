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
        element: <Navigate to="/analytics" replace />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/analytics" replace />,
      },
    ],
  },
])
