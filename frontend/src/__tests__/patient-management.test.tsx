import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PatientManagementPage } from '@/pages/PatientManagementPage'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_PATIENTS = [
  { id: 'pt1', firstName: 'John', lastName: 'Doe',   dob: '1990-01-01', gender: 'MALE',   phone: '+14155550101', email: 'john@example.com',  isActive: true },
  { id: 'pt2', firstName: 'Jane', lastName: 'Smith', dob: '1985-03-20', gender: 'FEMALE', phone: '+14155550102', email: 'jane@example.com',  isActive: true },
]

vi.mock('@/services/api', () => ({
  default: {
    get:  vi.fn(() => Promise.resolve({
      data: { data: MOCK_PATIENTS, pagination: { page: 1, limit: 20, total: 2, pages: 1 } },
    })),
    put:  vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

function renderPage() {
  return render(<MemoryRouter><PatientManagementPage /></MemoryRouter>)
}

afterEach(() => { vi.restoreAllMocks() })

describe('PatientManagementPage', () => {
  it('renders patient list with header and Add Patient button', async () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /patients/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /add patient/i })).toBeTruthy()
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
    }, { timeout: 3000 })
  })

  it('renders search input', () => {
    renderPage()
    expect(screen.getByLabelText(/search patients/i)).toBeInTheDocument()
  })

  it('shows empty state when API returns no patients', async () => {
    const { default: api } = await import('@/services/api')
    ;(api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no patients yet/i)).toBeTruthy()
    }, { timeout: 3000 })
  })

  it('opens Add Patient form when button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /add patient/i }))
    expect(screen.getByRole('heading', { name: /add patient/i })).toBeTruthy()
  })
})
