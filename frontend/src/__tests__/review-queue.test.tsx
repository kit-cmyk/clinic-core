import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_QUEUE = [
  {
    id: 'q1',
    patient: { firstName: 'John', lastName: 'Doe' },
    testName: 'Lab Result',
    createdAt: '2026-03-20T10:00:00',
    resultFileUrl: 'report.pdf',
  },
  {
    id: 'q2',
    patient: { firstName: 'Jane', lastName: 'Smith' },
    testName: 'Prescription',
    createdAt: '2026-03-20T11:00:00',
    resultFileUrl: 'rx.pdf',
  },
  {
    id: 'q3',
    patient: { firstName: 'Carlos', lastName: 'Rivera' },
    testName: 'Referral',
    createdAt: '2026-03-21T09:00:00',
    resultFileUrl: null,
  },
  {
    id: 'q4',
    patient: { firstName: 'Priya', lastName: 'Patel' },
    testName: 'Other',
    createdAt: '2026-03-21T10:00:00',
    resultFileUrl: null,
  },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes('/api/v1/review-queue'))
        return Promise.resolve({ data: { data: MOCK_QUEUE } })
      return Promise.resolve({ data: { data: [] } })
    }),
    post:  vi.fn(() => Promise.resolve({ data: { data: {} } })),
    put:   vi.fn(() => Promise.resolve({ data: { data: {} } })),
    patch: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    delete: vi.fn(() => Promise.resolve({})),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('ReviewQueuePage', () => {
  it('renders queue items with mock data', async () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Carlos Rivera')).toBeInTheDocument()
    expect(screen.getByText('Priya Patel')).toBeInTheDocument()
  })

  it('shows reject reason input when Reject clicked', async () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    await screen.findByText('John Doe')
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })
    await user.click(rejectButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/rejection reason/i)).toBeInTheDocument()
    })
  })

  it('Mark Reviewed removes item from list', async () => {
    render(<MemoryRouter><ReviewQueuePage /></MemoryRouter>)
    await screen.findByText('John Doe')
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
    await screen.findByText('John Doe')
    await user.click(screen.getByRole('button', { name: /^lab result$/i }))
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })
  })
})
