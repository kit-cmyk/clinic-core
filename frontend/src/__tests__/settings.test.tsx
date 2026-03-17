import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('SettingsPage', () => {
  it('renders General section by default', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument()
  })

  it('switching to Branding section shows branding fields', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /branding/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument()
    })
  })

  it('switching to Patient Permissions shows toggle', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /patient permissions/i }))
    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })

  it('Save button shows success message', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    const saveBtn = screen.getByRole('button', { name: /save/i })
    await user.click(saveBtn)
    await waitFor(() => {
      expect(screen.getByText(/saved!/i)).toBeInTheDocument()
    })
  })
})
