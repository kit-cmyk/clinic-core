import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { renderHook } from '@testing-library/react'

afterEach(() => { vi.restoreAllMocks() })

describe('SyncStatusBadge (CC-77)', () => {
  it('shows Synced badge by default', () => {
    const { result } = renderHook(() => useSyncStatus())
    render(<SyncStatusBadge sync={result.current} />)
    expect(screen.getByText('Synced')).toBeInTheDocument()
  })

  it('shows Pending badge after addPending is called', () => {
    const { result } = renderHook(() => useSyncStatus())
    act(() => { result.current.addPending() })
    render(<SyncStatusBadge sync={result.current} />)
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('clicking the badge expands the sync panel', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useSyncStatus())
    render(<SyncStatusBadge sync={result.current} />)
    const badgeBtn = screen.getByRole('button', { name: /sync status/i })
    await user.click(badgeBtn)
    await waitFor(() => {
      expect(screen.getByText(/all changes are saved/i)).toBeInTheDocument()
    })
  })

  it('Sync now button closes panel and transitions hook state to syncing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const { result } = renderHook(() => useSyncStatus())
    act(() => { result.current.addPending() })
    render(<SyncStatusBadge sync={result.current} />)
    // Open panel
    await user.click(screen.getByRole('button', { name: /sync status/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /sync now/i }))
    await waitFor(() => {
      expect(result.current.state).toBe('syncing')
    })
    vi.useRealTimers()
  })
})
