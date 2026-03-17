import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import RegisterPage from '@/pages/RegisterPage'

const router = createBrowserRouter([
  // Auth routes — centered card layout
  {
    element: <AuthLayout><LoginPage /></AuthLayout>,
    path: '/login',
  },
  {
    element: <AuthLayout><RegisterPage /></AuthLayout>,
    path: '/register',
  },
  // App routes — sidebar layout
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/appointments', element: <ComingSoon label="Appointments" /> },
      { path: '/patients', element: <ComingSoon label="Patients" /> },
      { path: '/lab', element: <ComingSoon label="Lab Records" /> },
      { path: '/billing', element: <ComingSoon label="Billing" /> },
      { path: '/organizations', element: <ComingSoon label="Organizations" /> },
      { path: '/settings', element: <ComingSoon label="Settings" /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <p className="text-2xl font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">This module is coming soon.</p>
    </div>
  )
}

export default router
