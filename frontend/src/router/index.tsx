import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import RegisterPage from '@/pages/RegisterPage'
import InviteAcceptPage from '@/pages/InviteAcceptPage'
import { PlansPage } from '@/pages/admin/PlansPage'
import { TenantsPage } from '@/pages/admin/TenantsPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { BranchesPage } from '@/pages/BranchesPage'
import { StaffPage } from '@/pages/StaffPage'
import { SettingsPage } from '@/pages/SettingsPage'
import PatientRegisterPage from '@/pages/patient/PatientRegisterPage'
import { PatientPortalLayout } from '@/pages/patient/PatientPortalLayout'
import { PortalDashboardPage } from '@/pages/patient/PortalDashboardPage'
import { PortalAppointmentsPage } from '@/pages/patient/PortalAppointmentsPage'
import { PortalResultsPage } from '@/pages/patient/PortalResultsPage'
import { PortalPrescriptionsPage } from '@/pages/patient/PortalPrescriptionsPage'

const router = createBrowserRouter([
  // Public auth routes — redirect to /dashboard if already authenticated
  {
    path: '/login',
    element: (
      <PublicRoute>
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <AuthLayout>
          <RegisterPage />
        </AuthLayout>
      </PublicRoute>
    ),
  },
  {
    path: '/patient/register',
    element: <PatientRegisterPage />,
  },
  {
    path: '/portal',
    element: <PatientPortalLayout />,
    children: [
      { index: true, element: <PortalDashboardPage /> },
      { path: 'appointments', element: <PortalAppointmentsPage /> },
      { path: 'results', element: <PortalResultsPage /> },
      { path: 'prescriptions', element: <PortalPrescriptionsPage /> },
    ],
  },
  {
    path: '/invite/accept',
    element: (
      <AuthLayout>
        <InviteAcceptPage />
      </AuthLayout>
    ),
  },
  // Protected app routes — redirect to /login if not authenticated
  {
    element: <ProtectedRoute />,
    children: [
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
          { path: '/settings', element: <SettingsPage /> },
          { path: '/admin/plans', element: <PlansPage /> },
          { path: '/admin/tenants', element: <TenantsPage /> },
          { path: '/onboarding', element: <OnboardingPage /> },
          { path: '/branches', element: <BranchesPage /> },
          { path: '/staff', element: <StaffPage /> },
        ],
      },
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
