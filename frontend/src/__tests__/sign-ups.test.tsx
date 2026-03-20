import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SignUpsPage } from '@/pages/admin/SignUpsPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function setSuperAdmin() {
  useAuthStore.setState({
    user: { id: '1', email: 'admin@test.com', name: 'Super Admin', role: 'super_admin', tenantId: 't1' },
    token: 'tok', isAuthenticated: true, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('SignUpsPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><SignUpsPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders all sign-up requests in All filter', () => {
    setSuperAdmin()
    render(<MemoryRouter><SignUpsPage /></MemoryRouter>)
    expect(screen.getByText('Northside Family Clinic')).toBeInTheDocument()
    expect(screen.getByText('BrightLife Diagnostics')).toBeInTheDocument()
    expect(screen.getByText('Sunrise Wellness Center')).toBeInTheDocument()
    expect(screen.getByText('MedFast Urgent Care')).toBeInTheDocument()
  })

  it('Pending filter shows only pending requests', async () => {
    setSuperAdmin()
    render(<MemoryRouter><SignUpsPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /pending/i }))
    await waitFor(() => {
      expect(screen.getByText('Northside Family Clinic')).toBeInTheDocument()
      expect(screen.getByText('BrightLife Diagnostics')).toBeInTheDocument()
      expect(screen.queryByText('Sunrise Wellness Center')).not.toBeInTheDocument()
      expect(screen.queryByText('MedFast Urgent Care')).not.toBeInTheDocument()
    })
  })

  it('clicking a row opens detail Sheet with contact name', async () => {
    setSuperAdmin()
    render(<MemoryRouter><SignUpsPage /></MemoryRouter>)
    await user.click(screen.getByText('Northside Family Clinic'))
    await waitFor(() => {
      // Contact Name only appears in the Sheet panel, not the table
      expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument()
      // Multiple emails visible — use getAllByText to confirm presence
      expect(screen.getAllByText('dr.santos@northside.com').length).toBeGreaterThan(0)
    })
  })
})
