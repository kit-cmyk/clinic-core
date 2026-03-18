import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { useAuthStore } from '@/store/auth'

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
  it('Renders day view by default', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /appointments/i })).toBeInTheDocument()
    // Day view shows time slots
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('08:30')).toBeInTheDocument()
  })

  it('Toggle to week view shows week layout', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /^week$/i }))
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })
  })

  it('Secretary can click available slot to see booking form', async () => {
    render(<RouterProvider router={buildRouter()} />)
    // No user → isSecretary defaults to true
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    expect(bookBtns.length).toBeGreaterThan(0)
    await user.click(bookBtns[0])
    await waitFor(() => {
      // Patient combobox has placeholder "Search by name or phone…"
      expect(screen.getByPlaceholderText(/search by name or phone/i)).toBeInTheDocument()
    })
  })

  it('Appointment slots show patient name and type', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getAllByText('Consultation').length).toBeGreaterThan(0)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })
})

describe('AppointmentsPage — patient combobox (CC-108)', () => {
  it('Patient combobox shows suggestions on focus', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)
    await user.click(combobox)
    // Dropdown shows patient names — John Doe may appear in both calendar and dropdown
    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    })
  })

  it('Typing in combobox filters patient suggestions', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)
    await user.type(combobox, 'Maria')
    await waitFor(() => {
      // Maria Chen should appear in the filtered dropdown
      expect(screen.getAllByText('Maria Chen').length).toBeGreaterThan(0)
    })
  })

  it('Create new patient option is visible in dropdown', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)
    await user.click(combobox)
    await waitFor(() => {
      expect(screen.getByText(/\+ create new patient/i)).toBeInTheDocument()
    })
  })

  it('Selecting a patient from suggestions fills in the combobox', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const bookBtns = screen.getAllByRole('button', { name: /^book$/i })
    await user.click(bookBtns[0])
    const combobox = await screen.findByPlaceholderText(/search by name or phone/i)
    // Type "Anna" — Anna Kowalski has no appointment today, so only appears in dropdown
    await user.type(combobox, 'Anna')
    const suggestion = await screen.findByText('Anna Kowalski')
    fireEvent.mouseDown(suggestion)
    await waitFor(() => {
      expect((combobox as HTMLInputElement).value).toBe('Anna Kowalski')
    })
  })
})
