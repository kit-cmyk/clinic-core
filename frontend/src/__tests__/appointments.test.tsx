import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

// Use local date (same as component's fmt() which uses getFullYear/getMonth/getDate)
const _now = new Date()
const TODAY_STR = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

const MOCK_APPTS = [
  {
    id: 'a1', patientId: 'pt1',
    patient: { firstName: 'John', lastName: 'Doe' },
    professionalId: 'p1',
    scheduledAt: `${TODAY_STR}T08:30:00`,
    durationMins: 30,
    type: 'Consultation',
    status: 'BOOKED',
    notes: null,
  },
  {
    id: 'a2', patientId: 'pt2',
    patient: { firstName: 'Jane', lastName: 'Smith' },
    professionalId: 'p2',
    scheduledAt: `${TODAY_STR}T09:30:00`,
    durationMins: 30,
    type: 'Consultation',
    status: 'BOOKED',
    notes: null,
  },
]

const MOCK_PROFS = [
  { id: 'p1', specialization: 'GP', isActive: true, user: { firstName: 'Sarah', lastName: 'Kim', role: 'DOCTOR', email: 's@c.com' } },
]

const PATIENT_RESULTS: Record<string, object[]> = {
  'Maria': [{ id: 'pt-m', firstName: 'Maria', lastName: 'Chen',     phone: '+14155550102' }],
  'Anna':  [{ id: 'pt-a', firstName: 'Anna',  lastName: 'Kowalski', phone: '+14155550103' }],
}

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string, config?: { params?: Record<string, string> }) => {
      if (url === '/api/v1/appointments')
        return Promise.resolve({ data: { data: MOCK_APPTS } })
      if (url === '/api/v1/professionals')
        return Promise.resolve({ data: { data: MOCK_PROFS } })
      if (url === '/api/v1/patients') {
        const search = config?.params?.search ?? ''
        return Promise.resolve({ data: { data: PATIENT_RESULTS[search] ?? [] } })
      }
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

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/appointments', element: <AppointmentsPage /> }],
    { initialEntries: ['/appointments'] },
  )
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('AppointmentsPage (CC-61)', () => {
  it('Renders day view by default', async () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument()
    // Day view time slots appear once loading completes
    await waitFor(() => {
      expect(screen.getByText('08:00')).toBeInTheDocument()
      expect(screen.getByText('08:30')).toBeInTheDocument()
    })
  })

  it('Toggle to week view shows week layout', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => expect(screen.queryByText('Loading appointments…')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^week$/i }))
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })
  })

  it('Secretary can click available slot to see booking form', async () => {
    render(<RouterProvider router={buildRouter()} />)
    // Wait for loading to complete then Book buttons appear for empty slots
    await waitFor(() => {
      const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
      expect(bookBtns.length).toBeGreaterThan(0)
    })
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name or phone/i)).toBeInTheDocument()
    })
  })

  it('Appointment slots show patient name and type', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getAllByText('Consultation').length).toBeGreaterThan(0)
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })
})

describe('AppointmentsPage — patient combobox (CC-108)', () => {
  it('Create new patient option is visible when dropdown is open', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => {
      const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
      expect(bookBtns.length).toBeGreaterThan(0)
    })
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)
    await user.click(combobox)
    await waitFor(() => {
      expect(screen.getByText(/\+ create new patient/i)).toBeInTheDocument()
    })
  })

  it('Typing in combobox triggers patient search and shows results', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => {
      const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
      expect(bookBtns.length).toBeGreaterThan(0)
    })
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)

    // Type 'Maria' — after debounce the API returns Maria Chen
    await user.type(combobox, 'Maria')
    await waitFor(() => {
      expect(screen.getAllByText('Maria Chen').length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('Selecting a patient from suggestions fills in the combobox', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => {
      const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
      expect(bookBtns.length).toBeGreaterThan(0)
    })
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)

    await user.type(combobox, 'Anna')
    const suggestion = await screen.findByText('Anna Kowalski', {}, { timeout: 1000 })
    fireEvent.mouseDown(suggestion)
    await waitFor(() => {
      expect((combobox as HTMLInputElement).value).toBe('Anna Kowalski')
    })
  })
})
