import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PortalInvoicesPage } from '@/pages/patient/PortalInvoicesPage'

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/portal/invoices', element: <PortalInvoicesPage /> }],
    { initialEntries: ['/portal/invoices'] },
  )
}

describe('PortalInvoicesPage (CC-91)', () => {
  it('Renders invoice list with invoice numbers', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /my invoices/i })).toBeInTheDocument()
    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-003')).toBeInTheDocument()
  })

  it('Shows outstanding balance summary when balance > 0', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByText(/outstanding balance/i)).toBeInTheDocument()
    // At least one overdue invoice in mock data
    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0)
  })

  it('Expanding an invoice card shows line item breakdown', async () => {
    render(<RouterProvider router={buildRouter()} />)
    // Click first invoice card
    const rows = screen.getAllByRole('button', { name: /^INV/ })
    // Cards use aria-expanded, find one
    const card = screen.getByText('INV-2026-001').closest('[role="button"]')
    expect(card).toBeTruthy()
    await user.click(card!)
    await waitFor(() => {
      expect(screen.getByText(/breakdown/i)).toBeInTheDocument()
      expect(screen.getByText('General Consultation')).toBeInTheDocument()
    })
  })

  it('Paid invoices show paid confirmation date', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const paidCard = screen.getByText('INV-2026-001').closest('[role="button"]')!
    await user.click(paidCard)
    await waitFor(() => {
      expect(screen.getByText(/paid on/i)).toBeInTheDocument()
    })
  })
})
