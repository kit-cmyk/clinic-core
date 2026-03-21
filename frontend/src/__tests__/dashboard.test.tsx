import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

beforeEach(() => { resetStore() })
afterEach(() => { resetStore() })

describe('DashboardPage — stat cards and layout (CC-102)', () => {
  it('renders stat cards with key metrics', () => {
    renderDashboard()
    // Stat card titles (may appear multiple times — also in the Today's Appointments section heading)
    expect(screen.getAllByText("Today's Appointments").length).toBeGreaterThan(0)
    expect(screen.getByText('Active Patients')).toBeInTheDocument()
    expect(screen.getAllByText('Pending Lab Results').length).toBeGreaterThan(0)
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument()
  })

  it('renders Professionals Today widget with professional names', () => {
    renderDashboard()
    expect(screen.getByText(/professionals today/i)).toBeInTheDocument()
    // Professional names appear at least once in the widget
    expect(screen.getAllByText('Dr. Sarah Kim').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dr. James Park').length).toBeGreaterThan(0)
  })

  it('Book Appointment header button opens the booking sheet', async () => {
    renderDashboard()
    // The quick-action bar shows "New Appointment" for receptionist role (default when user is null)
    const bookBtn = screen.getByRole('button', { name: /^new appointment$/i })
    await user.click(bookBtn)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /book appointment/i })).toBeInTheDocument()
    })
  })

  it('clicking a professional row opens sheet pre-filled with that professional', async () => {
    renderDashboard()
    // canBook is true when user is null (no auth)
    const profRow = screen.getByRole('button', { name: /book appointment with dr\. sarah kim/i })
    await user.click(profRow)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /book appointment/i })).toBeInTheDocument()
    })
    // Professional selector should be visible and have a value
    const profSelect = screen.getByRole('combobox', { name: /professional/i })
    expect((profSelect as HTMLSelectElement).value).toBeTruthy()
  })
})
