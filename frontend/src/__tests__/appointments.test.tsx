import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/appointments', element: <AppointmentsPage /> }],
    { initialEntries: ['/appointments'] },
  )
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('AppointmentsPage (CC-61)', () => {
  it('Renders day view by default', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument()
    // Day view shows time slots
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('08:30')).toBeInTheDocument()
  })

  it('Toggle to week view shows week layout', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^week$/i }))
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })
  })

  it('Secretary can click available slot to see booking form', async () => {
    render(<RouterProvider router={buildRouter()} />)
    // No user → isSecretary defaults to true
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    expect(bookBtns.length).toBeGreaterThan(0)
    await user.click(bookBtns[0])
    await waitFor(() => {
      expect(screen.getByLabelText(/patient name/i)).toBeInTheDocument()
    })
  })

  it('Appointment slots show patient name and type', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Consultation')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })
})
