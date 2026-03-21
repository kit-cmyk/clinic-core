import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProvisioningPage } from '@/pages/admin/ProvisioningPage'
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

describe('ProvisioningPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><ProvisioningPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders all 4 pipeline steps', () => {
    setSuperAdmin()
    render(<MemoryRouter><ProvisioningPage /></MemoryRouter>)
    expect(screen.getByText('Create Tenant Record')).toBeInTheDocument()
    expect(screen.getByText('Seed Default Roles')).toBeInTheDocument()
    expect(screen.getByText('Setup Storage Prefix')).toBeInTheDocument()
    expect(screen.getByText('Send Welcome Email')).toBeInTheDocument()
  })

  it('failed step shows error message and Retry button', () => {
    setSuperAdmin()
    render(<MemoryRouter><ProvisioningPage /></MemoryRouter>)
    expect(screen.getByText(/Supabase Storage API timeout/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry step/i })).toBeInTheDocument()
  })

  it('clicking Retry clears the error message', async () => {
    setSuperAdmin()
    render(<MemoryRouter><ProvisioningPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /retry step/i }))
    await waitFor(() => {
      expect(screen.queryByText(/Supabase Storage API timeout/i)).not.toBeInTheDocument()
    })
  })
})
