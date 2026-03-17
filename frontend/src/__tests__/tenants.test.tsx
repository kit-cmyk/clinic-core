import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TenantsPage } from '@/pages/admin/TenantsPage'
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

describe('TenantsPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><TenantsPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders tenant list for super_admin', () => {
    setSuperAdmin()
    render(<MemoryRouter><TenantsPage /></MemoryRouter>)
    expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
    expect(screen.getByText('Green Valley Health')).toBeInTheDocument()
    expect(screen.getByText('Apex Diagnostics')).toBeInTheDocument()
    expect(screen.getByText('Sunrise Wellness')).toBeInTheDocument()
  })

  it('search input filters tenants by name', async () => {
    setSuperAdmin()
    render(<MemoryRouter><TenantsPage /></MemoryRouter>)
    await user.type(screen.getByPlaceholderText(/search tenants/i), 'City')
    await waitFor(() => {
      expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
      expect(screen.queryByText('Green Valley Health')).not.toBeInTheDocument()
    })
  })

  it('clicking a tenant shows detail panel', async () => {
    setSuperAdmin()
    render(<MemoryRouter><TenantsPage /></MemoryRouter>)
    await user.click(screen.getByText('City Medical Clinic'))
    await waitFor(() => {
      expect(screen.getByText('admin@citymedical.com')).toBeInTheDocument()
    })
  })
})
