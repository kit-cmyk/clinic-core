import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BranchesPage } from '@/pages/BranchesPage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Branch',       address: '123 Main St',   phone: '+1 555 100 0001', isActive: true  },
  { id: 'b2', name: 'Downtown Clinic',   address: '456 Park Ave',  phone: '+1 555 200 0002', isActive: true  },
  { id: 'b3', name: 'Westside Location', address: '789 West Blvd', phone: '+1 555 300 0003', isActive: false },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes('/api/v1/branches')) return Promise.resolve({ data: { data: MOCK_BRANCHES } })
      return Promise.resolve({ data: { data: [] } })
    }),
    post: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    put:  vi.fn(() => Promise.resolve({ data: { data: {} } })),
    patch: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    delete: vi.fn(() => Promise.resolve({})),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('BranchesPage', () => {
  it('renders branch list with mock data', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    expect(await screen.findByText('Main Branch')).toBeInTheDocument()
    expect(screen.getByText('Downtown Clinic')).toBeInTheDocument()
    expect(screen.getByText('Westside Location')).toBeInTheDocument()
  })

  it('shows add form when Add Branch clicked', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    await screen.findByText('Main Branch')
    await user.click(screen.getByRole('button', { name: /add branch/i }))
    expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument()
  })

  it('hides add form when Cancel clicked', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    await screen.findByText('Main Branch')
    await user.click(screen.getByRole('button', { name: /add branch/i }))
    expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByLabelText(/branch name/i)).not.toBeInTheDocument()
    })
  })

  it('shows deactivate confirmation when Deactivate clicked via dropdown', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    await screen.findByText('Main Branch')
    // Open the first ellipsis dropdown
    const moreButtons = screen.getAllByRole('button', { name: '' })
    const ellipsisBtn = moreButtons.find(b => b.querySelector('svg'))
    expect(ellipsisBtn).toBeTruthy()
    await user.click(ellipsisBtn!)
    // Click Deactivate in the dropdown
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /deactivate/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('menuitem', { name: /deactivate/i }))
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
  })
})
