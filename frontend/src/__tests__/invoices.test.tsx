import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { InvoicesPage } from '@/pages/InvoicesPage'

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/billing', element: <InvoicesPage /> }],
    { initialEntries: ['/billing'] },
  )
}

describe('InvoicesPage (CC-90)', () => {
  it('Renders billing heading and invoice list', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /billing/i })).toBeInTheDocument()
    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('Shows status badges for different invoice states', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getAllByText(/paid/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0)
  })

  it('Filtering by draft tab shows only draft invoices', async () => {
    render(<RouterProvider router={buildRouter()} />)
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
