import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuthStore } from '@/store/auth'

// ── API mock ───────────────────────────────────────────────────────────────────

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/api/v1/organization')
        return Promise.resolve({ data: { name: 'ClinicCore Demo', email: 'admin@clinic.com' } })
      if (url === '/api/v1/organization/settings')
        return Promise.resolve({ data: { brandColor: '#2563eb', patientSelfUploadEnabled: false } })
      if (url.includes('/api/v1/services'))
        return Promise.resolve({ data: { data: [] } })
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

describe('SettingsPage', () => {
  it('renders General section by default', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    expect(await screen.findByLabelText(/organization name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument()
  })

  it('switching to Branding section shows branding fields', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    await screen.findByLabelText(/organization name/i)
    await user.click(screen.getByRole('button', { name: /branding/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument()
    })
  })

  it('switching to Patient Permissions shows toggle', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    await screen.findByLabelText(/organization name/i)
    await user.click(screen.getByRole('button', { name: /patient permissions/i }))
    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })

  it('Save button shows success message', async () => {
    render(
      <MemoryRouter>
        <Toaster />
        <SettingsPage />
      </MemoryRouter>
    )
    await screen.findByLabelText(/organization name/i)
    const saveBtn = screen.getByRole('button', { name: /save/i })
    await user.click(saveBtn)
    await waitFor(() => {
      // Component uses toast.success — match the toast message text
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument()
    })
  })
})
