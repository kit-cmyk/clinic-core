import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function buildRouter(initialEntry = '/login') {
  return createMemoryRouter(
    [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        ),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [{ path: '/dashboard', element: <DashboardPage /> }],
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  )
}

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,   // mark as initialized so routes render immediately
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

describe('LoginPage — form behaviour', () => {
  it('shows validation error when submitted empty', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter your email and password/i)
  })

  it('shows invalid credentials error for short password', async () => {
    // Mock login to immediately return an error — avoids the 700ms stub delay
    vi.spyOn(useAuthStore.getState(), 'login').mockImplementation(async () => {
      useAuthStore.setState({ isLoading: false, error: 'Invalid email or password.' })
    })
    render(<RouterProvider router={buildRouter()} />)
    await user.type(screen.getByLabelText(/email/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'abc')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i),
    )
  })

  it('shows loading spinner during login request', async () => {
    // Mock login to set isLoading and hang — simulates an in-flight request
    vi.spyOn(useAuthStore.getState(), 'login').mockImplementation(async () => {
      useAuthStore.setState({ isLoading: true, error: null })
      await new Promise(() => {}) // never resolves
    })
    render(<RouterProvider router={buildRouter()} />)
    await user.type(screen.getByLabelText(/email/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'validpassword')
    void user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/signing in/i)).toBeInTheDocument())
  })
})

describe('ProtectedRoute', () => {
  it('redirects unauthenticated user from /dashboard to /login', async () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })
})

describe('PublicRoute', () => {
  it('redirects authenticated user from /login to /dashboard', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'mock.token',
      user: {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'org_admin',
        tenantId: 't1',
      },
    })
    render(<RouterProvider router={buildRouter('/login')} />)
    await waitFor(() => {
      expect(screen.getByText(/good morning/i)).toBeInTheDocument()
    })
  })
})

describe('Auth store — logout', () => {
  it('clears isAuthenticated and token on logout', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', user: null })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })
})
