import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ProfessionalsPage } from '@/pages/ProfessionalsPage'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_PROFESSIONALS = [
  {
    id: 'p1', tenantId: 't1', userId: 'u1',
    specialization: 'General Medicine',
    bio: 'Experienced GP.',
    slotDurationMins: 30,
    isActive: true,
    branch: 'Main Branch',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    user: { firstName: 'Sarah', lastName: 'Kim', email: 's@clinic.com', role: 'DOCTOR' },
    schedules: [
      { id: 'sch1', branchId: 'b1', weekday: 1, startTime: '08:00', endTime: '17:00' },
    ],
  },
  {
    id: 'p2', tenantId: 't1', userId: 'u2',
    specialization: 'Cardiology',
    bio: 'Cardiologist.',
    slotDurationMins: 30,
    isActive: true,
    branch: 'Main Branch',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    user: { firstName: 'James', lastName: 'Park', email: 'j@clinic.com', role: 'DOCTOR' },
    schedules: [],
  },
  {
    id: 'p3', tenantId: 't1', userId: 'u3',
    specialization: 'General Medicine',
    bio: 'GP at Downtown.',
    slotDurationMins: 30,
    isActive: true,
    branch: 'Downtown Clinic',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    user: { firstName: 'Liu', lastName: 'Wei', email: 'l@clinic.com', role: 'DOCTOR' },
    schedules: [],
  },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: MOCK_PROFESSIONALS } })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/professionals', element: <ProfessionalsPage /> }],
    { initialEntries: ['/professionals'] },
  )
}

afterEach(() => { vi.restoreAllMocks() })

describe('ProfessionalsPage (CC-85)', () => {
  it('Renders professional list with name and specialization', async () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /professionals/i })).toBeInTheDocument()
    // Wait for API to load
    await waitFor(() => {
      expect(screen.getByText('Sarah Kim')).toBeInTheDocument()
      expect(screen.getAllByText(/general medicine/i).length).toBeGreaterThan(0)
      expect(screen.getByText('James Park')).toBeInTheDocument()
    })
  })

  it('Expands a professional row to show profile tab with details', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => screen.getByText('Sarah Kim'))
    const row = screen.getByText('Sarah Kim').closest('[role="button"]')
    expect(row).toBeTruthy()
    await user.click(row!)
    await waitFor(() => {
      expect(screen.getAllByText(/specialization:/i).length).toBeGreaterThan(0)
    })
  })

  it('Switches to schedule tab inside expanded row', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => screen.getByText('Sarah Kim'))
    await user.click(screen.getByText('Sarah Kim').closest('[role="button"]')!)
    await user.click(screen.getByRole('button', { name: /^schedule$/i }))
    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save schedule/i })).toBeInTheDocument()
    })
  })

  it('Branch filter dropdown renders with branch options', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => screen.getByText('Sarah Kim'))
    const filterSelect = screen.getByRole('combobox', { name: /filter by branch/i })
    expect(filterSelect).toBeInTheDocument()
    // Options present in the dropdown
    expect(screen.getByRole('option', { name: /main branch/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /downtown clinic/i })).toBeInTheDocument()
  })
})
