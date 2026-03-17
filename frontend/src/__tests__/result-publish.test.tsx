import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ResultPublishPage } from '@/pages/lab/ResultPublishPage'
import { useAuthStore } from '@/store/auth'

const user = userEvent.setup()

function resetStore() {
  useAuthStore.setState({
    user: null, token: null, isAuthenticated: false, isLoading: false, error: null,
  })
}

beforeEach(() => { sessionStorage.clear(); resetStore() })
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); resetStore() })

describe('ResultPublishPage', () => {
  it('renders publish form', () => {
    render(<MemoryRouter><ResultPublishPage /></MemoryRouter>)
    expect(screen.getByText(/publish lab result/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/test name/i)).toBeInTheDocument()
  })

  it('Publish button shows confirmation before submitting', async () => {
    render(<MemoryRouter><ResultPublishPage /></MemoryRouter>)
    // Select a patient
    await user.type(screen.getByLabelText(/patient/i), 'John')
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())
    await user.click(screen.getByText('John Doe'))
    // Upload a file
    const file = new File(['content'], 'result.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    // Fill test name
    await user.type(screen.getByLabelText(/test name/i), 'CBC')
    // Click Publish
    await user.click(screen.getByRole('button', { name: /^publish$/i }))
    await waitFor(() => {
      expect(screen.getByText(/immediately visible to the patient/i)).toBeInTheDocument()
    })
  })

  it('shows success message after confirming', async () => {
    render(<MemoryRouter><ResultPublishPage /></MemoryRouter>)
    await user.type(screen.getByLabelText(/patient/i), 'John')
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())
    await user.click(screen.getByText('John Doe'))
    const file = new File(['content'], 'result.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    await user.type(screen.getByLabelText(/test name/i), 'CBC')
    await user.click(screen.getByRole('button', { name: /^publish$/i }))
    await waitFor(() => expect(screen.getByText(/immediately visible/i)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /confirm publish/i }))
    await waitFor(() => {
      expect(screen.getByText(/result published to patient portal/i)).toBeInTheDocument()
    })
  })

  it('Cancel hides confirmation', async () => {
    render(<MemoryRouter><ResultPublishPage /></MemoryRouter>)
    await user.type(screen.getByLabelText(/patient/i), 'John')
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())
    await user.click(screen.getByText('John Doe'))
    const file = new File(['content'], 'result.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    await user.type(screen.getByLabelText(/test name/i), 'CBC')
    await user.click(screen.getByRole('button', { name: /^publish$/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /confirm publish/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    await waitFor(() => {
      expect(screen.queryByText(/immediately visible/i)).not.toBeInTheDocument()
    })
  })
})
