import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PatientPortalLayout } from '@/pages/patient/PatientPortalLayout'
import { PortalDashboardPage } from '@/pages/patient/PortalDashboardPage'
import { PortalAppointmentsPage } from '@/pages/patient/PortalAppointmentsPage'
import { PortalResultsPage } from '@/pages/patient/PortalResultsPage'
import { PortalPrescriptionsPage } from '@/pages/patient/PortalPrescriptionsPage'
import { useAuthStore } from '@/store/auth'

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function buildPortalRouter(initialPath = '/portal') {
  return createMemoryRouter(
    [
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
    ],
    { initialEntries: [initialPath] },
  )
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('Patient Portal', () => {
  it('Dashboard renders summary cards', () => {
    render(<RouterProvider router={buildPortalRouter()} />)
    expect(screen.getByText(/next appointment/i)).toBeInTheDocument()
    expect(screen.getByText(/active prescriptions/i)).toBeInTheDocument()
    expect(screen.getByText(/recent results/i)).toBeInTheDocument()
  })

  it('Appointments page renders appointment list', () => {
    render(<RouterProvider router={buildPortalRouter('/portal/appointments')} />)
    const sarahKimCells = screen.getAllByText('Dr. Sarah Kim')
    expect(sarahKimCells.length).toBeGreaterThan(0)
    const consultationCells = screen.getAllByText('Consultation')
    expect(consultationCells.length).toBeGreaterThan(0)
  })

  it('Results page renders results with download button', () => {
    render(<RouterProvider router={buildPortalRouter('/portal/results')} />)
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument()
    const downloadButtons = screen.getAllByRole('button', { name: /download/i })
    expect(downloadButtons.length).toBeGreaterThan(0)
  })

  it('Prescriptions page renders prescription list', () => {
    render(<RouterProvider router={buildPortalRouter('/portal/prescriptions')} />)
    expect(screen.getByText('Amoxicillin')).toBeInTheDocument()
    expect(screen.getByText('Metformin')).toBeInTheDocument()
  })
})
