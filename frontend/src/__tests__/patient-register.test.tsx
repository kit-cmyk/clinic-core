import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import PatientRegisterPage from '@/pages/patient/PatientRegisterPage'

const user = userEvent.setup()

function buildRouter(search = '') {
  return createMemoryRouter(
    [{ path: '/patient/register', element: <PatientRegisterPage /> }],
    { initialEntries: [`/patient/register${search}`] },
  )
}

beforeEach(() => { sessionStorage.clear() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('PatientRegisterPage', () => {
  it('shows error for invalid/missing token', () => {
    render(<RouterProvider router={buildRouter('?token=abc')} />)
    expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
  })

  it('shows welcome message for valid token', () => {
    render(<RouterProvider router={buildRouter('?token=validtoken123')} />)
    expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/city clinic/i)).toBeInTheDocument()
  })

  it('shows validation error for mismatched passwords', async () => {
    render(<RouterProvider router={buildRouter('?token=validtoken123')} />)
    await user.type(screen.getByLabelText(/date of birth/i), '2000-01-01')
    await user.selectOptions(screen.getByLabelText(/gender/i), 'male')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpass')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
    })
  })

  it('shows success message on valid form submit', async () => {
    render(<RouterProvider router={buildRouter('?token=validtoken123')} />)
    await user.type(screen.getByLabelText(/date of birth/i), '2000-01-01')
    await user.selectOptions(screen.getByLabelText(/gender/i), 'male')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeInTheDocument()
    })
  })
})
