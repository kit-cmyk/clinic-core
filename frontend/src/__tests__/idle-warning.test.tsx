import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { IdleWarningModal } from '@/components/IdleWarningModal'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('IdleWarningModal (CC-148)', () => {
  it('is hidden by default', () => {
    render(<IdleWarningModal />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows modal with countdown when idle-warning fires', () => {
    render(<IdleWarningModal />)
    act(() => { window.dispatchEvent(new CustomEvent('idle-warning')) })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText(/stay logged in/i)).toBeInTheDocument()
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('closes modal when idle-reset fires', () => {
    render(<IdleWarningModal />)
    act(() => { window.dispatchEvent(new CustomEvent('idle-warning')) })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    act(() => { window.dispatchEvent(new CustomEvent('idle-reset')) })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('countdown ticks down every second', () => {
    vi.useFakeTimers()
    render(<IdleWarningModal />)
    act(() => { window.dispatchEvent(new CustomEvent('idle-warning')) })
    expect(screen.getByText('2:00')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText('1:57')).toBeInTheDocument()
  })

  it('countdown resets to 2:00 on successive warnings', () => {
    vi.useFakeTimers()
    render(<IdleWarningModal />)
    act(() => { window.dispatchEvent(new CustomEvent('idle-warning')) })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('1:55')).toBeInTheDocument()
    // Simulate reset then another warning
    act(() => { window.dispatchEvent(new CustomEvent('idle-reset')) })
    act(() => { window.dispatchEvent(new CustomEvent('idle-warning')) })
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })
})
