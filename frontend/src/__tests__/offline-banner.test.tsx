import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuthStore } from '@/store/auth'

function resetStore() {
  useAuthStore.setState({
    user: { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'doctor', tenantId: 't1' },
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })
}

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/', element: <AppLayout />, children: [{ index: true, element: <div>Dashboard</div> }] }],
    { initialEntries: ['/'] },
  )
}

beforeEach(() => { resetStore() })
afterEach(() => { vi.restoreAllMocks(); resetStore() })

describe('Offline Banner (CC-71)', () => {
  it('does not show offline banner when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows offline banner when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
  })

  it('shows offline banner when offline event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
  })

  it('hides offline banner when online event fires after going offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
