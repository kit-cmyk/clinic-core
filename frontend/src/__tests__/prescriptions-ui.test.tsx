import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PatientChartPage } from '@/pages/PatientChartPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function buildRouter(patientId = 'default') {
  return createMemoryRouter(
    [{ path: '/patients/:patientId/chart', element: <PatientChartPage /> }],
    { initialEntries: [`/patients/${patientId}/chart`] },
  )
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('Prescriptions UI (CC-59)', () => {
  async function goToPrescriptionsTab() {
    await user.click(screen.getByRole('button', { name: /^prescriptions$/i }))
  }

  it('New Prescription button shows form in Prescriptions tab', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await goToPrescriptionsTab()
    await user.click(screen.getByRole('button', { name: /new prescription/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/^medication$/i)).toBeInTheDocument()
    })
  })

  it('Form validation: required fields — empty submit does nothing', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await goToPrescriptionsTab()
    await user.click(screen.getByRole('button', { name: /new prescription/i }))
    // Click Save without filling required fields
    await user.click(screen.getByRole('button', { name: /save prescription/i }))
    // Form should still be visible (save rejected)
    expect(screen.getByLabelText(/^medication$/i)).toBeInTheDocument()
  })

  it('Saved prescription appears in list', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await goToPrescriptionsTab()
    await user.click(screen.getByRole('button', { name: /new prescription/i }))
    await user.type(screen.getByLabelText(/^medication$/i), 'Metformin')
    await user.type(screen.getByLabelText(/^dosage$/i), '1000mg')
    await user.type(screen.getByLabelText(/^duration$/i), '30 days')
    await user.click(screen.getByRole('button', { name: /save prescription/i }))
    await waitFor(() => {
      expect(screen.getByText(/metformin/i)).toBeInTheDocument()
    })
  })

  it('Mark Complete moves prescription to history', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await goToPrescriptionsTab()
    // Amoxicillin is Active by default
    const markCompleteButtons = screen.getAllByRole('button', { name: /mark complete/i })
    await user.click(markCompleteButtons[0])
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument()
    })
  })
})
