import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ProfessionalsPage } from '@/pages/ProfessionalsPage'

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/professionals', element: <ProfessionalsPage /> }],
    { initialEntries: ['/professionals'] },
  )
}

describe('ProfessionalsPage (CC-85)', () => {
  it('Renders professional list with name and specialization', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /professionals/i })).toBeInTheDocument()
    expect(screen.getByText('Dr. Sarah Kim')).toBeInTheDocument()
    // Specialization appears at least once (may also appear in filter dropdown)
    expect(screen.getAllByText(/general medicine/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Dr. James Park')).toBeInTheDocument()
  })

  it('Expands a professional row to show profile tab with details', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const row = screen.getByText('Dr. Sarah Kim').closest('[role="button"]')
    expect(row).toBeTruthy()
    await user.click(row!)
    await waitFor(() => {
      // "Specialization:" label/span appears in the expanded profile
      expect(screen.getAllByText(/specialization:/i).length).toBeGreaterThan(0)
    })
  })

  it('Switches to schedule tab inside expanded row', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByText('Dr. Sarah Kim').closest('[role="button"]')!)
    await user.click(screen.getByRole('button', { name: /^schedule$/i }))
    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save schedule/i })).toBeInTheDocument()
    })
  })

  it('Filters professionals by branch', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.selectOptions(screen.getByRole('combobox', { name: /filter by branch/i }), 'Downtown Clinic')
    await waitFor(() => {
      expect(screen.getByText('Dr. Liu Wei')).toBeInTheDocument()
      expect(screen.queryByText('Dr. James Park')).not.toBeInTheDocument()
    })
  })
})
