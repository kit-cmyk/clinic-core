import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppointmentVisitPage } from '@/pages/AppointmentVisitPage'

function renderVisit(id = 'a10') {
  return render(
    <MemoryRouter initialEntries={[`/appointments/${id}/visit`]}>
      <Routes>
        <Route path="/appointments/:appointmentId/visit" element={<AppointmentVisitPage />} />
        <Route path="/appointments" element={<div>Appointments</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AppointmentVisitPage', () => {
  it('renders patient name and appointment details', () => {
    renderVisit('a10')
    expect(screen.getByText('John Doe')).toBeTruthy()
    expect(screen.getAllByText(/follow-up/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/dr\. sarah kim/i)).toBeTruthy()
  })

  it('shows not found message for unknown appointment', () => {
    renderVisit('unknown-id')
    expect(screen.getByText(/appointment not found/i)).toBeTruthy()
  })

  it('switches between tabs', () => {
    renderVisit('a10')
    fireEvent.click(screen.getByRole('button', { name: /patient history/i }))
    // pt1 has history — shows visit timeline. Check for a unique date from MOCK_HISTORY['pt1']
    expect(screen.getByText(/2026-02-15/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^billing$/i }))
    // BillingTab shows historical invoices for pt1
    expect(screen.getByText('Consultation — Dr. Sarah Kim')).toBeTruthy()
  })

  it('billing: can add items and create invoice', () => {
    renderVisit('a10')
    // Click the Billing SECTION toggle on the visit tab (second button with name "Billing")
    const billingBtns = screen.getAllByRole('button', { name: /^billing$/i })
    fireEvent.click(billingBtns[billingBtns.length - 1])
    // Quick add a General Consultation (valid service in QUICK_ITEMS)
    const quickAdd = screen.getByLabelText(/quick add item/i)
    fireEvent.change(quickAdd, { target: { value: 'General Consultation' } })
    // Create invoice button should now be enabled
    const createBtn = screen.getByRole('button', { name: /create draft invoice/i })
    expect(createBtn).toBeTruthy()
    fireEvent.click(createBtn)
    expect(screen.getByText(/draft invoice created/i)).toBeTruthy()
  })
})
