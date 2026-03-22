import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ClinicHoursPage } from '@/pages/ClinicHoursPage'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Branch' },
  { id: 'b2', name: 'Downtown Clinic' },
]

function makeHours(branchId: string) {
  return Array.from({ length: 7 }, (_, i) => ({
    id:        `h-${branchId}-${i}`,
    tenantId:  't1',
    branchId,
    weekday:   i,
    openTime:  '08:00',
    closeTime: '17:00',
    isClosed:  false,
  }))
}

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/api/v1/branches')
        return Promise.resolve({ data: { data: MOCK_BRANCHES } })
      if (url.includes('/api/v1/clinic-hours'))
        return Promise.resolve({ data: { data: makeHours(url.includes('b2') ? 'b2' : 'b1') } })
      if (url.includes('/api/v1/special-closures'))
        return Promise.resolve({ data: { data: [] } })
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

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/clinic-hours', element: <ClinicHoursPage /> }],
    { initialEntries: ['/clinic-hours'] },
  )
}

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.restoreAllMocks() })

describe('ClinicHoursPage (CC-87)', () => {
  it('Renders heading and branch tabs', async () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(await screen.findByRole('heading', { name: /clinic hours/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /main branch/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /downtown clinic/i })).toBeInTheDocument()
  })

  it('Shows weekday rows in view-only mode', async () => {
    render(<RouterProvider router={buildRouter()} />)
    // Wait for both branches and hours data to load
    expect(await screen.findByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
  })

  it('Switching branches changes the active tab', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await screen.findByRole('button', { name: /downtown clinic/i })
    await user.click(screen.getByRole('button', { name: /downtown clinic/i }))
    await waitFor(() => {
      expect(screen.getByText(/downtown clinic.*weekly hours/i)).toBeInTheDocument()
    })
  })

  it('Edit icon enables editing and Save button commits changes', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await screen.findByText('Monday')
    // Click edit pencil button
    await user.click(screen.getAllByTitle(/edit hours/i)[0])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save hours/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /save hours/i }))
    await waitFor(() => {
      // After save, editing mode ends — Save Hours button is gone
      expect(screen.queryByRole('button', { name: /save hours/i })).not.toBeInTheDocument()
    })
  })
})
