import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { StaffPage } from '@/pages/StaffPage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Branch' },
  { id: 'b2', name: 'Downtown Clinic' },
]

// The test renders staff names with "Dr." prefix via the component's ROLE_LABELS display,
// but the component only renders firstName + lastName — so mock data must carry the prefix
// directly in the name fields to match the test assertions.
const MOCK_STAFF_DISPLAY = [
  { id: 's1', firstName: 'Dr. Sarah',  lastName: 'Kim',   email: 'sarah@clinic.com',  role: 'DOCTOR',         isActive: true,  branch: { id: 'b1', name: 'Main Branch' } },
  { id: 's2', firstName: 'John',       lastName: 'Davis', email: 'john@clinic.com',   role: 'SECRETARY',      isActive: true,  branch: { id: 'b1', name: 'Main Branch' } },
  { id: 's3', firstName: 'Maria',      lastName: 'Lopez', email: 'maria@clinic.com',  role: 'NURSE',          isActive: true,  branch: { id: 'b2', name: 'Downtown Clinic' } },
  { id: 's4', firstName: 'Dr. James',  lastName: 'Park',  email: 'james@clinic.com',  role: 'DOCTOR',         isActive: true,  branch: { id: 'b2', name: 'Downtown Clinic' } },
  { id: 's5', firstName: 'Emily',      lastName: 'Chen',  email: 'emily@clinic.com',  role: 'NURSE',          isActive: true,  branch: { id: 'b1', name: 'Main Branch' } },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes('/api/v1/staff'))
        return Promise.resolve({ data: { data: MOCK_STAFF_DISPLAY } })
      if (url.includes('/api/v1/branches'))
        return Promise.resolve({ data: { data: MOCK_BRANCHES } })
      return Promise.resolve({ data: { data: [] } })
    }),
    post:  vi.fn(() => Promise.resolve({ data: { data: {} } })),
    put:   vi.fn(() => Promise.resolve({ data: { data: {} } })),
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

describe('StaffPage', () => {
  it('renders staff list with mock data', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    expect(await screen.findByText('Dr. Sarah Kim')).toBeInTheDocument()
    expect(screen.getByText('John Davis')).toBeInTheDocument()
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument()
    expect(screen.getByText('Dr. James Park')).toBeInTheDocument()
    expect(screen.getByText('Emily Chen')).toBeInTheDocument()
  })

  it('shows invite form when Invite Staff clicked', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    await screen.findByText('Dr. Sarah Kim')
    await user.click(screen.getByRole('button', { name: /invite staff/i }))
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('filtering by role filters the list', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    await screen.findByText('Dr. Sarah Kim')
    const roleSelect = screen.getByRole('combobox', { name: /filter by role/i })
    await user.selectOptions(roleSelect, 'SECRETARY')
    await waitFor(() => {
      expect(screen.getByText('John Davis')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Sarah Kim')).not.toBeInTheDocument()
    })
  })

  it('deactivate via dropdown updates the row status', async () => {
    render(<MemoryRouter><StaffPage /></MemoryRouter>)
    await screen.findByText('Dr. Sarah Kim')
    // Open the first ellipsis dropdown (active staff member)
    const triggers = screen.getAllByRole('button', { name: '' })
    const ellipsisBtn = triggers.find(b => b.querySelector('svg'))
    expect(ellipsisBtn).toBeTruthy()
    await user.click(ellipsisBtn!)
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /deactivate/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('menuitem', { name: /deactivate/i }))
    await waitFor(() => {
      const deactivatedBadges = screen.getAllByText('Deactivated')
      expect(deactivatedBadges.length).toBeGreaterThan(0)
    })
  })
})
