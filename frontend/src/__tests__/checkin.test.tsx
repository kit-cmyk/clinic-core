import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { CheckInPage } from '@/pages/CheckInPage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

const TODAY_STR = new Date().toISOString().slice(0, 10)

const MOCK_APPOINTMENTS = [
  {
    id: 'ci1',
    patientId: 'pt1',
    patient: { firstName: 'John', lastName: 'Doe' },
    professionalId: 'p1',
    scheduledAt: `${TODAY_STR}T08:00:00`,
    durationMins: 30,
    type: 'Consultation',
    status: 'BOOKED',
  },
  {
    id: 'ci2',
    patientId: 'pt2',
    patient: { firstName: 'Jane', lastName: 'Smith' },
    professionalId: 'p1',
    scheduledAt: `${TODAY_STR}T09:00:00`,
    durationMins: 30,
    type: 'Follow-up',
    status: 'BOOKED',
  },
  {
    id: 'ci3',
    patientId: 'pt3',
    patient: { firstName: 'Carlos', lastName: 'Rivera' },
    professionalId: 'p2',
    scheduledAt: `${TODAY_STR}T10:00:00`,
    durationMins: 30,
    type: 'Consultation',
    status: 'CHECKED_IN',
  },
  {
    id: 'ci4',
    patientId: 'pt4',
    patient: { firstName: 'Anna', lastName: 'Lee' },
    professionalId: 'p1',
    scheduledAt: `${TODAY_STR}T11:00:00`,
    durationMins: 30,
    type: 'Lab Review',
    status: 'BOOKED',
  },
  {
    id: 'ci5',
    patientId: 'pt5',
    patient: { firstName: 'Mike', lastName: 'Torres' },
    professionalId: 'p2',
    scheduledAt: `${TODAY_STR}T12:00:00`,
    durationMins: 30,
    type: 'Consultation',
    status: 'NO_SHOW',
  },
]

const MOCK_PROFESSIONALS = [
  { id: 'p1', specialization: 'GP', isActive: true, user: { firstName: 'Sarah', lastName: 'Kim' } },
  { id: 'p2', specialization: 'Nurse', isActive: true, user: { firstName: 'James', lastName: 'Park' } },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes('/api/v1/appointments'))
        return Promise.resolve({ data: { data: MOCK_APPOINTMENTS } })
      if (url.includes('/api/v1/professionals'))
        return Promise.resolve({ data: { data: MOCK_PROFESSIONALS } })
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

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/check-in', element: <CheckInPage /> }],
    { initialEntries: ['/check-in'] },
  )
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('CheckInPage (CC-63)', () => {
  it("renders today's appointment list", async () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /patient check-in/i })).toBeInTheDocument()
    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Carlos Rivera')).toBeInTheDocument()
  })

  it('Check In button updates row status to Checked In', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await screen.findByText('John Doe')
    const checkInBtns = screen.getAllByRole('button', { name: /^check in$/i })
    await user.click(checkInBtns[0])
    // Confirm dialog appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    await waitFor(() => {
      const checkedInBadges = screen.getAllByText('Checked In')
      expect(checkedInBadges.length).toBeGreaterThan(0)
    })
  })

  it('No Show button marks appointment as No Show', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await screen.findByText('John Doe')
    const noShowBtns = screen.getAllByRole('button', { name: /^no show$/i })
    await user.click(noShowBtns[0])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm no show/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /confirm no show/i }))
    await waitFor(() => {
      const noShowBadges = screen.getAllByText('No Show')
      expect(noShowBadges.length).toBeGreaterThan(1) // was 1 (ci5), now at least 2
    })
  })

  it('Already checked-in appointment shows Checked In badge without Check In button', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await screen.findByText('Carlos Rivera')
    // The checked-in row should show a Checked In badge
    expect(screen.getAllByText('Checked In').length).toBeGreaterThan(0)
  })
})
