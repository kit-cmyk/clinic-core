import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClinicHoursPage } from '@/pages/ClinicHoursPage'

const MOCK_HOLIDAYS = [
  { date: '2026-01-01', localName: "New Year's Day", name: "New Year's Day" },
  { date: '2026-04-09', localName: 'Araw ng Kagitingan', name: 'Day of Valor' },
  { date: '2026-06-12', localName: 'Araw ng Kalayaan', name: 'Independence Day' },
]

afterEach(() => { vi.restoreAllMocks() })

describe('ClinicHoursPage holiday sync', () => {
  it('renders country selector and sync button', () => {
    render(<ClinicHoursPage />)
    expect(screen.getByLabelText(/country for holiday sync/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /sync holidays/i })).toBeTruthy()
  })

  it('fetches holidays and shows success message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_HOLIDAYS,
    }))
    render(<ClinicHoursPage />)
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
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => screen.getByText(/synced 3 holidays/i))

    // Second sync — all duplicates
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => expect(screen.getByText(/synced 0 holidays/i)).toBeTruthy())
  })

  it('shows error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    render(<ClinicHoursPage />)
    fireEvent.click(screen.getByRole('button', { name: /sync holidays/i }))
    await waitFor(() => expect(screen.getByText(/failed to fetch/i)).toBeTruthy())
  })
})
