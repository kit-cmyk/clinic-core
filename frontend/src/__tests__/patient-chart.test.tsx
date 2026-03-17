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

describe('PatientChartPage', () => {
  it('renders Overview tab by default with patient data', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByText(/patient chart/i)).toBeInTheDocument()
    expect(screen.getByText(/demographics/i)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('switching to Uploaded Records tab shows pending uploads', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /uploaded records/i }))
    await waitFor(() => {
      expect(screen.getByText('referral_letter.pdf')).toBeInTheDocument()
    })
  })

  it('Verify button shows verification form', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /uploaded records/i }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^verify$/i }).length).toBeGreaterThan(0))
    await user.click(screen.getAllByRole('button', { name: /^verify$/i })[0])
    await waitFor(() => {
      expect(screen.getByLabelText(/clinical notes/i)).toBeInTheDocument()
    })
  })

  it('Other tabs render without errors', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^visits$/i }))
    await waitFor(() => expect(screen.getByText('Dr. Sarah Kim')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^lab results$/i }))
    await waitFor(() => expect(screen.getByText('Complete Blood Count')).toBeInTheDocument())
  })
})
