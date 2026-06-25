import { createBrowserRouter, Navigate } from 'react-router-dom'
import DashboardLayout from '@/layout/DashboardLayout'
import { ReportsPage } from '@/features/reports'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/reports" replace />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/reports" replace />,
      },
    ],
  },
])
