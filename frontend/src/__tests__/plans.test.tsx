import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PlansPage } from '@/pages/admin/PlansPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })
}

function setSuperAdmin() {
  useAuthStore.setState({
    user: { id: '1', email: 'admin@test.com', name: 'Super Admin', role: 'super_admin', tenantId: 't1' },
    token: 'tok',
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })
}

beforeEach(() => {
  sessionStorage.clear()
  resetStore()
})

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  resetStore()
})

describe('PlansPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
    render(<MemoryRouter><PlansPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders plan list with mock data for super_admin', () => {
    setSuperAdmin()
    render(<MemoryRouter><PlansPage /></MemoryRouter>)
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('shows create form when New Plan clicked', async () => {
    setSuperAdmin()
    render(<MemoryRouter><PlansPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /new plan/i }))
    expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument()
  })

  it('hides create form when Cancel clicked', async () => {
    setSuperAdmin()
    render(<MemoryRouter><PlansPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /new plan/i }))
    expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByLabelText(/plan name/i)).not.toBeInTheDocument()
    })
  })
})
