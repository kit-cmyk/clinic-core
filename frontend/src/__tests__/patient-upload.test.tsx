import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PortalUploadPage } from '@/pages/patient/PortalUploadPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('PortalUploadPage', () => {
  it('Upload button disabled when no file selected', () => {
    render(<MemoryRouter><PortalUploadPage /></MemoryRouter>)
    const uploadBtn = screen.getByRole('button', { name: /^upload$/i })
    expect(uploadBtn).toBeDisabled()
  })

  it('Upload button disabled when no category selected', async () => {
    render(<MemoryRouter><PortalUploadPage /></MemoryRouter>)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    const uploadBtn = screen.getByRole('button', { name: /^upload$/i })
    expect(uploadBtn).toBeDisabled()
  })

  it('Upload button enabled when both file and category present', async () => {
    render(<MemoryRouter><PortalUploadPage /></MemoryRouter>)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    await user.selectOptions(screen.getByLabelText(/category/i), 'Lab Result')
    const uploadBtn = screen.getByRole('button', { name: /^upload$/i })
    expect(uploadBtn).not.toBeDisabled()
  })

  it('shows success message after submit', async () => {
    render(<MemoryRouter><PortalUploadPage /></MemoryRouter>)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    await user.selectOptions(screen.getByLabelText(/category/i), 'Lab Result')
    await user.click(screen.getByRole('button', { name: /^upload$/i }))
    await waitFor(() => {
      expect(screen.getByText(/pending clinic review/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
