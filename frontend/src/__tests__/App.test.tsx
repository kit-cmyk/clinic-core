import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AuthLayout } from '@/layouts/AuthLayout'

function renderWithRouter(routes: Parameters<typeof createMemoryRouter>[0], initialEntry = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })
  return render(<RouterProvider router={router} />)
}

describe('LoginPage', () => {
  const loginRoutes = [
    {
      path: '/login',
      element: (
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      ),
    },
    { path: '*', element: <NotFoundPage /> },
  ]

  it('renders email and password fields', () => {
    renderWithRouter(loginRoutes, '/login')
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows validation error when submitted empty', async () => {
    renderWithRouter(loginRoutes, '/login')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/please enter your email and password/i)).toBeInTheDocument()
  })

  it('shows loading state on submit with credentials', async () => {
    renderWithRouter(loginRoutes, '/login')
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })
})

describe('NotFoundPage', () => {
  it('renders 404 text', () => {
    renderWithRouter([{ path: '*', element: <NotFoundPage /> }], '/anything')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})
