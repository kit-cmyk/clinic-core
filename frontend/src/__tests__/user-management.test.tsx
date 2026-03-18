import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { UserManagementPage } from '@/pages/UserManagementPage'

const user = userEvent.setup()

function buildRouter() {
  return createMemoryRouter(
    [
      { path: '/users', element: <UserManagementPage /> },
    ],
    { initialEntries: ['/users'] },
  )
}

describe('UserManagementPage (CC-88)', () => {
  it('Renders heading and staff list by default', () => {
    render(<RouterProvider router={buildRouter()} />)
    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument()
    expect(screen.getByText('Dr. Sarah Kim')).toBeInTheDocument()
    expect(screen.getByText('sarah.kim@clinic.com')).toBeInTheDocument()
  })

  it('Opens invite sheet when Invite User clicked', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.click(screen.getByRole('button', { name: /invite user/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('Search filters staff by name', async () => {
    render(<RouterProvider router={buildRouter()} />)
    await user.type(screen.getByRole('textbox', { name: /search/i }), 'james')
    await waitFor(() => {
      expect(screen.getByText('Dr. James Park')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Sarah Kim')).not.toBeInTheDocument()
    })
  })

  it('Shows ellipsis action menu on each row', async () => {
    render(<RouterProvider router={buildRouter()} />)
    const triggers = screen.getAllByRole('button', { name: '' })
    const ellipsisBtn = triggers.find(b => b.querySelector('svg'))
    expect(ellipsisBtn).toBeTruthy()
    await user.click(ellipsisBtn!)
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /view details/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    })
  })
})
