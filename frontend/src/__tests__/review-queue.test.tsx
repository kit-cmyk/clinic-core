import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('ReviewQueuePage', () => {
  it('renders queue items with mock data', () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Carlos Rivera')).toBeInTheDocument()
    expect(screen.getByText('Priya Patel')).toBeInTheDocument()
  })

  it('shows reject reason input when Reject clicked', async () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })
    await user.click(rejectButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/rejection reason/i)).toBeInTheDocument()
    })
  })

  it('Mark Reviewed removes item from list', async () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    const reviewButtons = screen.getAllByRole('button', { name: /mark reviewed/i })
    await user.click(reviewButtons[0])
    // Click confirm
    await waitFor(() => expect(screen.getByRole('button', { name: /^yes$/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^yes$/i }))
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  it('Filter by category shows only matching items', async () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /^lab result$/i }))
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })
})
