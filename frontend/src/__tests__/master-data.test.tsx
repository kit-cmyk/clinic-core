import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MasterDataPage } from '@/pages/admin/MasterDataPage'
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

describe('MasterDataPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><MasterDataPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders Specialties tab with mock data by default', () => {
    setSuperAdmin()
    render(<MemoryRouter><MasterDataPage /></MemoryRouter>)
    expect(screen.getByText('General Practice')).toBeInTheDocument()
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
    expect(screen.getByText('Pediatrics')).toBeInTheDocument()
  })

  it('switching to Appointment Types tab shows correct data', async () => {
    setSuperAdmin()
    render(<MemoryRouter><MasterDataPage /></MemoryRouter>)
    await user.click(screen.getByRole('tab', { name: /appointment types/i }))
    await waitFor(() => {
      expect(screen.getByText('Consultation')).toBeInTheDocument()
      expect(screen.getByText('Follow-up')).toBeInTheDocument()
    })
  })

  it('Add button opens Sheet form', async () => {
    setSuperAdmin()
    render(<MemoryRouter><MasterDataPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /add specialty/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    })
  })
})
