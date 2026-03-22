import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClinicHoursPage } from '@/pages/ClinicHoursPage'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Branch' },
]

function makeHours(branchId: string) {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `h-${branchId}-${i}`, tenantId: 't1', branchId,
    weekday: i, openTime: '08:00', closeTime: '17:00', isClosed: false,
  }))
}

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/api/v1/branches')
        return Promise.resolve({ data: { data: MOCK_BRANCHES } })
      if (url.includes('/api/v1/clinic-hours'))
        return Promise.resolve({ data: { data: makeHours('b1') } })
      if (url.includes('/api/v1/special-closures'))
        return Promise.resolve({ data: { data: [] } })
      return Promise.resolve({ data: { data: [] } })
    }),
    post:  vi.fn((_, body: { date?: string; reason?: string; branchId?: string }) =>
      Promise.resolve({ data: { data: { id: `sc-${Date.now()}`, tenantId: 't1', branchId: 'b1', date: body?.date ?? '', reason: body?.reason ?? '' } } })
    ),
    put:   vi.fn(() => Promise.resolve({ data: { data: {} } })),
    patch: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    delete: vi.fn(() => Promise.resolve({})),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

const MOCK_HOLIDAYS = [
  { date: '2026-01-01', localName: "New Year's Day", name: "New Year's Day" },
  { date: '2026-04-09', localName: 'Araw ng Kagitingan', name: 'Day of Valor' },
  { date: '2026-06-12', localName: 'Araw ng Kalayaan', name: 'Independence Day' },
]

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.restoreAllMocks() })

describe('ClinicHoursPage holiday sync', () => {
  it('renders country selector and sync button', async () => {
    render(<ClinicHoursPage />)
    expect(await screen.findByLabelText(/country for holiday sync/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /sync holidays/i })).toBeTruthy()
  })

  it('fetches holidays and shows success message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_HOLIDAYS,
    }))
    render(<ClinicHoursPage />)
    await screen.findByRole('button', { name: /sync holidays/i })
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => expect(screen.getByText(/synced 3 holidays/i)).toBeTruthy())
  })

  it('skips duplicate dates on sync', async () => {
    // First sync
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_HOLIDAYS,
    }))
    render(<ClinicHoursPage />)
    await screen.findByRole('button', { name: /sync holidays/i })
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => screen.getByText(/synced 3 holidays/i))

    // Second sync — all duplicates
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => expect(screen.getByText(/synced 0 holidays/i)).toBeTruthy())
  })

  it('shows error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    render(<ClinicHoursPage />)
    await screen.findByRole('button', { name: /sync holidays/i })
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => expect(screen.getByText(/failed to fetch/i)).toBeTruthy())
  })
})
