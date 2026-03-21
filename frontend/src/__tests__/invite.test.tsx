import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { InviteAcceptPage } from '@/pages/InviteAcceptPage'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function buildRouter(token?: string) {
  const path = token ? `/invite/accept?token=${token}` : '/invite/accept'
  return createMemoryRouter(
    [
      {
        path: '/invite/accept',
        element: (
          <AuthLayout>
            <InviteAcceptPage />
          </AuthLayout>
        ),
      },
      { path: '/dashboard', element: <div>Dashboard</div> },
    ],
    { initialEntries: [path] },
  )
}

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })
}

beforeEach(() => {
  sessionStorage.clear()
  resetStore()
})

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  resetStore()
})

describe('InviteAcceptPage — token validation', () => {
  it('shows expired error when token is missing', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/expired or is invalid/i),
    )
  })

  it('shows expired error when token is too short', async () => {
    render(<RouterProvider router={buildRouter('short')} />)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/expired or is invalid/i),
    )
  })

  it('shows invite details for a valid token', async () => {
    render(<RouterProvider router={buildRouter('valid-invite-token')} />)
    await waitFor(() => expect(screen.getByText(/new staff member/i)).toBeInTheDocument())
    expect(screen.getByText(/newstaff@clinic\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/professional/i)).toBeInTheDocument()
    expect(screen.getByText(/main branch/i)).toBeInTheDocument()
  })
})

describe('InviteAcceptPage — password form', () => {
  it('shows error when password is too short', async () => {
    render(<RouterProvider router={buildRouter('valid-invite-token')} />)
    await waitFor(() => screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i),
    )
  })

  it('shows error when passwords do not match', async () => {
    render(<RouterProvider router={buildRouter('valid-invite-token')} />)
    await waitFor(() => screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123')
    await user.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i),
    )
  })

  it('shows loading spinner during submission', async () => {
    vi.spyOn(useAuthStore.getState(), 'acceptInvite').mockImplementation(async () => {
      useAuthStore.setState({ isLoading: true, error: null })
      await new Promise(() => {}) // never resolves
    })
    render(<RouterProvider router={buildRouter('valid-invite-token')} />)
    await waitFor(() => screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    void user.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() => expect(screen.getByText(/setting up account/i)).toBeInTheDocument())
  })

  it('redirects to /dashboard on success', async () => {
    vi.spyOn(useAuthStore.getState(), 'acceptInvite').mockImplementation(async () => {
      useAuthStore.setState({
        isLoading: false,
        isAuthenticated: true,
        token: 'mock.jwt.token',
        user: {
          id: '1',
          email: 'newstaff@clinic.com',
          name: 'New Staff Member',
          role: 'doctor',
          tenantId: 't1',
        },
      })
    })
    render(<RouterProvider router={buildRouter('valid-invite-token')} />)
    await waitFor(() => screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
  })
})
