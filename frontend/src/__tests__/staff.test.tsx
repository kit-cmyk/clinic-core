import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { StaffPage } from '@/pages/StaffPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('StaffPage', () => {
  it('renders staff list with mock data', () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    expect(screen.getByText('Dr. Sarah Kim')).toBeInTheDocument()
    expect(screen.getByText('John Davis')).toBeInTheDocument()
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    expect(screen.getByText('Dr. James Park')).toBeInTheDocument()
    expect(screen.getByText('Emily Chen')).toBeInTheDocument()
  })

  it('shows invite form when Invite Staff clicked', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /invite staff/i }))
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('filtering by role filters the list', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    const roleSelect = screen.getByRole('combobox', { name: /filter by role/i })
    await user.selectOptions(roleSelect, 'secretary')
    await waitFor(() => {
      expect(screen.getByText('John Davis')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Sarah Kim')).not.toBeInTheDocument()
    })
  })

  it('deactivate updates the row status', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    const deactivateButtons = screen.getAllByRole('button', { name: /deactivate/i })
    await user.click(deactivateButtons[0])
    await waitFor(() => {
      const deactivatedBadges = screen.getAllByText('Deactivated')
      expect(deactivatedBadges.length).toBeGreaterThan(0)
    })
  })
})
