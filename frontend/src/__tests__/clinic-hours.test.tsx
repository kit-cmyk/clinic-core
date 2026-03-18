import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ClinicHoursPage } from '@/pages/ClinicHoursPage'

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [{ path: '/clinic-hours', element: <ClinicHoursPage /> }],
    { initialEntries: ['/clinic-hours'] },
  )
}

describe('ClinicHoursPage (CC-87)', () => {
  it('Renders heading and branch tabs', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /clinic hours/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /main branch/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /downtown clinic/i })).toBeInTheDocument()
  })

  it('Shows weekday rows in view-only mode', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
  })

  it('Switching branches changes the active tab', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /downtown clinic/i }))
    await waitFor(() => {
      expect(screen.getByText(/downtown clinic.*weekly hours/i)).toBeInTheDocument()
    })
  })

  it('Edit icon enables editing and Save button commits changes', async () => {
    render(<RouterProvider router={buildRouter()} />)
    // Click edit pencil button
    await user.click(screen.getAllByTitle(/edit hours/i)[0])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save hours/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /save hours/i }))
    await waitFor(() => {
      // After save, editing mode ends — Save Hours button is gone
      expect(screen.queryByRole('button', { name: /save hours/i })).not.toBeInTheDocument()
    })
  })
})
