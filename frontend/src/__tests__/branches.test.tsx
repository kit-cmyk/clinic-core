import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BranchesPage } from '@/pages/BranchesPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('BranchesPage', () => {
  it('renders branch list with mock data', () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    expect(screen.getByText('Main Branch')).toBeInTheDocument()
    expect(screen.getByText('Downtown Clinic')).toBeInTheDocument()
    expect(screen.getByText('Westside Location')).toBeInTheDocument()
  })

  it('shows add form when Add Branch clicked', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /add branch/i }))
    expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument()
  })

  it('hides add form when Cancel clicked', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /add branch/i }))
    expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByLabelText(/branch name/i)).not.toBeInTheDocument()
    })
  })

  it('shows deactivate confirmation when Deactivate clicked', async () => {
    render(<MemoryRouter><BranchesPage /></MemoryRouter>)
    const deactivateButtons = screen.getAllByRole('button', { name: /deactivate/i })
    await user.click(deactivateButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
  })
})
