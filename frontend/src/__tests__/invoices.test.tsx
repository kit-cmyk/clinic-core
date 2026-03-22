import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { InvoicesPage } from '@/pages/InvoicesPage'

// ── API mock ───────────────────────────────────────────────────────────────────

const MOCK_INVOICES = [
  {
    id: 'inv1', invoiceNumber: 'INV-2026-001', patientId: 'pt1', appointmentId: null,
    status: 'PAID',    totalAmountCents: 15000,
    issuedAt: '2026-01-15', dueAt: '2026-01-30', paidAt: '2026-01-28', createdAt: '2026-01-15',
    patient: { firstName: 'John', lastName: 'Doe' },
    lineItems: [{ id: 'li1', description: 'Consultation', quantity: 1, unitPriceCents: 15000, totalCents: 15000 }],
  },
  {
    id: 'inv2', invoiceNumber: 'INV-2026-002', patientId: 'pt2', appointmentId: null,
    status: 'OVERDUE', totalAmountCents: 8000,
    issuedAt: '2026-02-01', dueAt: '2026-02-15', paidAt: null, createdAt: '2026-02-01',
    patient: { firstName: 'Jane', lastName: 'Smith' },
    lineItems: [{ id: 'li2', description: 'Follow-up', quantity: 1, unitPriceCents: 8000, totalCents: 8000 }],
  },
  {
    id: 'inv3', invoiceNumber: 'INV-2026-003', patientId: 'pt1', appointmentId: null,
    status: 'SENT',    totalAmountCents: 12000,
    issuedAt: '2026-03-01', dueAt: '2026-03-15', paidAt: null, createdAt: '2026-03-01',
    patient: { firstName: 'John', lastName: 'Doe' },
    lineItems: [],
  },
  {
    id: 'inv4', invoiceNumber: 'INV-2026-004', patientId: 'pt3', appointmentId: null,
    status: 'DRAFT',   totalAmountCents: 5000,
    issuedAt: '2026-03-10', dueAt: '2026-03-25', paidAt: null, createdAt: '2026-03-10',
    patient: { firstName: 'Carlos', lastName: 'Rivera' },
    lineItems: [],
  },
]

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({
      data: { data: MOCK_INVOICES, pagination: { page: 1, limit: 20, total: 4, pages: 1 } },
    })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put:  vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

// ──────────────────────────────────────────────────────────────────────────────

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/billing', element: <InvoicesPage /> }],
    { initialEntries: ['/billing'] },
  )
}

afterEach(() => { vi.restoreAllMocks() })

describe('InvoicesPage (CC-90)', () => {
  it('Renders billing heading and invoice list', async () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /billing/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    })
  })

  it('Shows status badges for different invoice states', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => {
      expect(screen.getAllByText(/paid/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0)
    })
  })

  it('Filtering by draft tab shows only draft invoices', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await waitFor(() => screen.getByText('INV-2026-001'))
    await user.click(screen.getByRole('button', { name: /^draft/i }))
    await waitFor(() => {
      expect(screen.queryByText('INV-2026-001')).not.toBeInTheDocument() // paid, filtered out
      expect(screen.getByText('INV-2026-004')).toBeInTheDocument()       // draft
    })
  })

  it('New Invoice button opens create side sheet with patient selector', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /new invoice/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /select patient/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument()
    })
  })
})
