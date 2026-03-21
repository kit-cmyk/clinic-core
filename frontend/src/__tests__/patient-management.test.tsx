import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PatientManagementPage } from '@/pages/PatientManagementPage'

function renderPage() {
  return render(<MemoryRouter><PatientManagementPage /></MemoryRouter>)
}

describe('PatientManagementPage', () => {
  it('renders patient list with header and Add Patient button', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /patients/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /add patient/i })).toBeTruthy()
    // At least one patient row rendered
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('filters patients by search query', () => {
    renderPage()
    const search = screen.getByLabelText(/search patients/i)
    fireEvent.change(search, { target: { value: 'John Doe' } })
    const rows = screen.getAllByRole('row')
    // header + 1 match
    expect(rows.length).toBe(2)
    expect(screen.getByText('John Doe')).toBeTruthy()
  })

  it('shows empty state when search has no matches', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/search patients/i), { target: { value: 'xyz-no-match-999' } })
    expect(screen.getByText(/no patients match/i)).toBeTruthy()
  })

  it('opens Add Patient form when button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /add patient/i }))
    // SheetTitle heading confirms the form is open
    expect(screen.getByRole('heading', { name: /add patient/i })).toBeTruthy()
  })
})
