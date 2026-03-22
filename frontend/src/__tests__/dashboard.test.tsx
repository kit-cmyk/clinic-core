import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

const TODAY_STR = new Date().toISOString().slice(0, 10)

const MOCK_APPOINTMENTS = [
  {
    id: 'a1', patientId: 'pt1',
    patient: { firstName: 'John', lastName: 'Doe' },
    professionalId: 'p1',
    scheduledAt: `${TODAY_STR}T08:30:00`,
    durationMins: 30, type: 'Consultation', status: 'BOOKED', notes: null,
    checkInAt: null,
    professional: { user: { firstName: 'Sarah', lastName: 'Kim' } },
  },
]

const MOCK_PROFESSIONALS = [
  {
    id: 'p1', tenantId: 't1', userId: 'u1',
    specialization: 'General Medicine', bio: '', slotDurationMins: 30, isActive: true,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    user: { firstName: 'Sarah', lastName: 'Kim', email: 's@clinic.com', role: 'DOCTOR' },
    schedules: [{ id: 'sch1', branchId: 'b1', weekday: 1, startTime: '08:00', endTime: '17:00' }],
  },
  {
    id: 'p2', tenantId: 't1', userId: 'u2',
    specialization: 'Cardiology', bio: '', slotDurationMins: 30, isActive: true,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    user: { firstName: 'James', lastName: 'Park', email: 'j@clinic.com', role: 'DOCTOR' },
    schedules: [],
  },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/api/v1/appointments')
        return Promise.resolve({ data: { data: MOCK_APPOINTMENTS, pagination: { total: 1 } } })
      if (url === '/api/v1/professionals')
        return Promise.resolve({ data: { data: MOCK_PROFESSIONALS } })
      return Promise.resolve({ data: { data: [] } })
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

beforeEach(() => { resetStore() })
afterEach(() => { resetStore(); vi.restoreAllMocks() })

describe('DashboardPage — stat cards and layout (CC-102)', () => {
  it('renders stat cards with key metrics', () => {
    renderDashboard()
    expect(screen.getAllByText("Today's Appointments").length).toBeGreaterThan(0)
    expect(screen.getByText('Active Patients')).toBeInTheDocument()
    expect(screen.getAllByText('Pending Lab Results').length).toBeGreaterThan(0)
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument()
  })

  it('renders Professionals Today widget with professional names from API', async () => {
    renderDashboard()
    expect(screen.getByText(/professionals today/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText('Sarah Kim').length).toBeGreaterThan(0)
      expect(screen.getAllByText('James Park').length).toBeGreaterThan(0)
    })
  })

  it('Book Appointment header button opens the booking sheet', async () => {
    renderDashboard()
    const bookBtn = screen.getByRole('button', { name: /^new appointment$/i })
    await user.click(bookBtn)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /book appointment/i })).toBeInTheDocument()
    })
  })

  it('clicking a professional row opens sheet pre-filled with that professional', async () => {
    renderDashboard()
    await waitFor(() => screen.getAllByText('Sarah Kim'))
    const profRow = screen.getByRole('button', { name: /book appointment with sarah kim/i })
    await user.click(profRow)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /book appointment/i })).toBeInTheDocument()
    })
    const profSelect = screen.getByRole('combobox', { name: /professional/i })
    expect((profSelect as HTMLSelectElement).value).toBeTruthy()
  })
})
