import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PlatformUpdatesPage } from '@/pages/admin/PlatformUpdatesPage'
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

describe('PlatformUpdatesPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><PlatformUpdatesPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders announcements section with mock data', () => {
    setSuperAdmin()
    render(<MemoryRouter><PlatformUpdatesPage /></MemoryRouter>)
    expect(screen.getByText('New Lab Results Module')).toBeInTheDocument()
    expect(screen.getByText('Scheduled Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Welcome to ClinicAlly v2')).toBeInTheDocument()
  })

  it('feature flags section shows all toggle rows', () => {
    setSuperAdmin()
    render(<MemoryRouter><PlatformUpdatesPage /></MemoryRouter>)
    expect(screen.getByText('Lab Records Module')).toBeInTheDocument()
    expect(screen.getByText('Teleconsult')).toBeInTheDocument()
    expect(screen.getByText('Billing & Invoices')).toBeInTheDocument()
    expect(screen.getByText('Offline Mode')).toBeInTheDocument()
  })

  it('Create Announcement button opens the sheet form', async () => {
    setSuperAdmin()
    render(<MemoryRouter><PlatformUpdatesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /create announcement/i }))
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })
  })
})
