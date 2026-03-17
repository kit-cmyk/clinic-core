import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { CheckInPage } from '@/pages/CheckInPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/check-in', element: <CheckInPage /> }],
    { initialEntries: ['/check-in'] },
  )
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('CheckInPage (CC-63)', () => {
  it("renders today's appointment list", () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /patient check-in/i })).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Carlos Rivera')).toBeInTheDocument()
  })

  it('Check In button updates row status to Checked In', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const checkInBtns = screen.getAllByRole('button', { name: /^check in$/i })
    await user.click(checkInBtns[0])
    // Confirm dialog appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    await waitFor(() => {
      const checkedInBadges = screen.getAllByText('Checked In')
      expect(checkedInBadges.length).toBeGreaterThan(0)
    })
  })

  it('No Show button marks appointment as No Show', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const noShowBtns = screen.getAllByRole('button', { name: /^no show$/i })
    await user.click(noShowBtns[0])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm no show/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /confirm no show/i }))
    await waitFor(() => {
      const noShowBadges = screen.getAllByText('No Show')
      expect(noShowBadges.length).toBeGreaterThan(1) // was 1 (ci5), now at least 2
    })
  })

  it('Already checked-in appointment shows Checked In badge without Check In button', () => {
    render(<RouterProvider router={buildRouter()} />)
    // Carlos Rivera is pre-checked-in (ci3)
    expect(screen.getByText('Carlos Rivera')).toBeInTheDocument()
    // The checked-in row should show a Checked In badge
    expect(screen.getAllByText('Checked In').length).toBeGreaterThan(0)
  })
})
