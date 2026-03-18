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

describe('EMR View (PatientChartPage — CC-57)', () => {
  it('Visits tab shows visit timeline', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^appointments$/i }))
    await waitFor(() => {
      expect(screen.getAllByText('Dr. Sarah Kim')[0]).toBeInTheDocument()
      expect(screen.getByText('Dr. James Park')).toBeInTheDocument()
    })
  })

  it('Clicking a visit expands its notes', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^appointments$/i }))
    await waitFor(() => expect(screen.getAllByText('Dr. Sarah Kim')[0]).toBeInTheDocument())
    // Click the first visit card to expand
    await user.click(screen.getByText('Consultation'))
    await waitFor(() => {
      expect(screen.getByText(/patient presented with mild fever/i)).toBeInTheDocument()
    })
  })

  it('Lab Results tab renders lab data', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^lab results$/i }))
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument()
      expect(screen.getByText('HbA1c')).toBeInTheDocument()
    })
  })

  it('Prescriptions tab renders prescription data', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^prescriptions$/i }))
    await waitFor(() => {
      expect(screen.getByText(/amoxicillin/i)).toBeInTheDocument()
    })
  })
})
