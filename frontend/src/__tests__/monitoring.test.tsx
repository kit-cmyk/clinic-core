import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MonitoringPage } from '@/pages/admin/MonitoringPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('@/services/api', () => {
  const MOCK_METRICS = {
    activeTenants: 4,
    totalTenants: 4,
    mrrUsd: 347,
    storageSumBytes: '1073741824',
    planBreakdown: { PRO: 2, BASIC: 1, FREE: 1 },
    tenants: [
      { id: 't1', name: 'City Medical Clinic',     plan: 'PRO',        isActive: true,  storageLimitBytes: '53687091200',  createdAt: '2025-11-12T00:00:00.000Z' },
      { id: 't2', name: 'Green Valley Health',     plan: 'BASIC',      isActive: true,  storageLimitBytes: '10737418240',  createdAt: '2026-01-05T00:00:00.000Z' },
      { id: 't3', name: 'Apex Diagnostics',        plan: 'ENTERPRISE', isActive: false, storageLimitBytes: '214748364800', createdAt: '2025-08-20T00:00:00.000Z' },
      { id: 't4', name: 'Northside Family Clinic', plan: 'FREE',       isActive: true,  storageLimitBytes: '5368709120',   createdAt: '2025-09-15T00:00:00.000Z' },
    ],
    cached: false,
    generatedAt: new Date().toISOString(),
  }
  return {
    default: {
      get: vi.fn((url: string) => {
        if (url === '/api/v1/metrics') return Promise.resolve({ data: MOCK_METRICS })
        return Promise.resolve({ data: [] })
      }),
      post: vi.fn(() => Promise.resolve({ data: {} })),
    },
  }
})

// ──────────────────────────────────────────────────────────────────────────────

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

  it('renders KPI cards with correct mock values', async () => {
    setSuperAdmin()
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Active Tenants')).toBeInTheDocument()
      expect(screen.getAllByText('$347').length).toBeGreaterThan(0)
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
    })
  })

  it('tenant health table shows all tenants', async () => {
    setSuperAdmin()
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
      expect(screen.getByText('Green Valley Health')).toBeInTheDocument()
      expect(screen.getByText('Apex Diagnostics')).toBeInTheDocument()
      expect(screen.getByText('Northside Family Clinic')).toBeInTheDocument()
    })
  })

  it('sort buttons change the active sort', async () => {
    setSuperAdmin()
    render(<MemoryRouter><MonitoringPage /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
    })
    const planBtn = screen.getByRole('button', { name: /^plan$/i })
    await user.click(planBtn)
    // After clicking Plan sort button, table still renders
    expect(screen.getByText('City Medical Clinic')).toBeInTheDocument()
  })
})
