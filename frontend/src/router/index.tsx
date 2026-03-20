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
import { MasterDataPage } from '@/pages/admin/MasterDataPage'
import { SignUpsPage } from '@/pages/admin/SignUpsPage'
import { ProvisioningPage } from '@/pages/admin/ProvisioningPage'
import { MonitoringPage } from '@/pages/admin/MonitoringPage'
import { PlatformUpdatesPage } from '@/pages/admin/PlatformUpdatesPage'
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
import { PortalUploadPage } from '@/pages/patient/PortalUploadPage'
import { ResultPublishPage } from '@/pages/lab/ResultPublishPage'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { PatientChartPage } from '@/pages/PatientChartPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { CheckInPage } from '@/pages/CheckInPage'
import { ProfessionalsPage } from '@/pages/ProfessionalsPage'
import { ClinicHoursPage } from '@/pages/ClinicHoursPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { InvoicesPage } from '@/pages/InvoicesPage'
import { PortalInvoicesPage } from '@/pages/patient/PortalInvoicesPage'
import { PatientManagementPage } from '@/pages/PatientManagementPage'
import { AppointmentVisitPage } from '@/pages/AppointmentVisitPage'
import { SuperAdminLoginPage } from '@/pages/SuperAdminLoginPage'
import { SuperAdminPublicRoute } from '@/components/SuperAdminPublicRoute'

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
    path: '/super-admin/login',
    element: (
      <SuperAdminPublicRoute>
        <SuperAdminLoginPage />
      </SuperAdminPublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
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
      { path: 'upload', element: <PortalUploadPage /> },
      { path: 'invoices', element: <PortalInvoicesPage /> },
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
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/patients', element: <PatientManagementPage /> },
          { path: '/appointments/:appointmentId/visit', element: <AppointmentVisitPage /> },
          { path: '/professionals', element: <ProfessionalsPage /> },
          { path: '/clinic-hours', element: <ClinicHoursPage /> },
          { path: '/users', element: <Navigate to="/settings" replace /> },
          { path: '/lab', element: <ComingSoon label="Lab Records" /> },
          { path: '/billing', element: <InvoicesPage /> },
          { path: '/organizations', element: <ComingSoon label="Organizations" /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/admin/plans', element: <PlansPage /> },
          { path: '/admin/tenants', element: <TenantsPage /> },
          { path: '/admin/master-data', element: <MasterDataPage /> },
          { path: '/admin/sign-ups', element: <SignUpsPage /> },
          { path: '/admin/provisioning/:tenantId', element: <ProvisioningPage /> },
          { path: '/admin/monitoring', element: <MonitoringPage /> },
          { path: '/admin/updates', element: <PlatformUpdatesPage /> },
          { path: '/onboarding', element: <OnboardingPage /> },
          { path: '/branches', element: <BranchesPage /> },
          { path: '/staff', element: <StaffPage /> },
          { path: '/lab/publish', element: <ResultPublishPage /> },
          { path: '/review-queue', element: <ReviewQueuePage /> },
          { path: '/patients/:patientId/chart', element: <PatientChartPage /> },
          { path: '/check-in', element: <CheckInPage /> },
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
