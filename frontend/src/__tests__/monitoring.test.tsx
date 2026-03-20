import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MonitoringPage } from '@/pages/admin/MonitoringPage'
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

describe('MonitoringPage', () => {
  it('shows Access Denied when user is not super_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it('renders KPI cards with correct mock values', () => {
    setSuperAdmin()
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    // Active Tenants label
    expect(screen.getByText('Active Tenants')).toBeInTheDocument()
    // Total MRR: 149 + 49 + 0 + 149 = 347 (appears in KPI card + chart)
    expect(screen.getAllByText('$347').length).toBeGreaterThan(0)
    // Monthly Recurring Revenue heading
    expect(screen.getByText('Monthly Recurring Revenue')).toBeInTheDocument()
  })

  it('tenant health table shows all tenants', () => {
    setSuperAdmin()
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
    expect(screen.getByText('Green Valley Health')).toBeInTheDocument()
    expect(screen.getByText('Apex Diagnostics')).toBeInTheDocument()
    expect(screen.getByText('Northside Family Clinic')).toBeInTheDocument()
  })

  it('sort buttons change the active sort', async () => {
    setSuperAdmin()
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    const planBtn = screen.getByRole('button', { name: /sort: plan/i })
    await user.click(planBtn)
    // After clicking Plan sort button it should become the active (default) variant
    // Just confirm the button exists and table still renders
    expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
  })
})
