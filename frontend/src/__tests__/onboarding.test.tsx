import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

function setOrgAdmin() {
  useAuthStore.setState({
    user: { id: '1', email: 'org@test.com', name: 'Org Admin', role: 'org_admin', tenantId: 't1' },
    token: 'tok', isAuthenticated: true, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('OnboardingPage', () => {
  it('shows step 1 on initial render for org_admin', () => {
    setOrgAdmin()
    render(<MemoryRouter><OnboardingPage /></MemoryRouter>)
    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
  })

  it('Next button advances to step 2', async () => {
    setOrgAdmin()
    render(<MemoryRouter><OnboardingPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    })
  })

  it('Back button returns to step 1 from step 2', async () => {
    setOrgAdmin()
    render(<MemoryRouter><OnboardingPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /back/i }))
    await waitFor(() => {
      expect(screen.getByText(/step 1/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    })
  })

  it('shows Access Denied for non-org_admin', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'doc@test.com', name: 'Doctor', role: 'doctor', tenantId: 't1' },
      token: 'tok', isAuthenticated: true, isLoading: false, error: null,
    })
    render(<MemoryRouter><OnboardingPage /></MemoryRouter>)
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })
})
