import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PatientForm } from '@/components/patients/PatientForm'
import { MOCK_PATIENTS } from '@/data/mockPatients'

describe('PatientForm', () => {
  it('renders add patient form with all fields', () => {
    render(<PatientForm open={true} onClose={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getAllByText('Add Patient').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText(/first name/i)).toBeTruthy()
    expect(screen.getByLabelText(/last name/i)).toBeTruthy()
    expect(screen.getByLabelText(/date of birth/i)).toBeTruthy()
    expect(screen.getByLabelText(/phone/i)).toBeTruthy()
  })

  it('shows validation errors when required fields are empty', () => {
    render(<PatientForm open={true} onClose={vi.fn()} onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /add patient/i }))
    const errors = screen.getAllByText('Required')
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })

  it('calls onSave with patient object when form is valid', () => {
    const onSave = vi.fn()
    render(<PatientForm open={true} onClose={vi.fn()} onSave={onSave} />)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '09171234567' } })
    fireEvent.change(screen.getByPlaceholderText(/rizal st/i), { target: { value: '123 Test St' } })
    fireEvent.click(screen.getByRole('button', { name: /add patient/i }))
    expect(onSave).toHaveBeenCalledOnce()
    const saved = onSave.mock.calls[0][0]
    expect(saved.firstName).toBe('Test')
    expect(saved.lastName).toBe('User')
    expect(saved.fullName).toBe('Test User')
    expect(saved.isActive).toBe(true)
  })

  it('renders in edit mode with pre-filled values', () => {
    const patient = MOCK_PATIENTS[0]
    render(<PatientForm open={true} onClose={vi.fn()} onSave={vi.fn()} initialValues={patient} />)
    expect(screen.getByText('Edit Patient')).toBeTruthy()
    expect(screen.getByDisplayValue(patient.firstName)).toBeTruthy()
    expect(screen.getByDisplayValue(patient.lastName)).toBeTruthy()
  })
})
