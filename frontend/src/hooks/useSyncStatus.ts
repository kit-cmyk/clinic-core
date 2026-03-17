import { useState, useCallback } from 'react'

export type SyncState = 'synced' | 'pending' | 'syncing' | 'conflict'

export interface SyncStatusData {
  state: SyncState
  pendingCount: number
  conflictCount: number
  // Simulate triggering a sync
  triggerSync: () => void
  // For tests / storybook: seed pending items
  addPending: () => void
}

// Stub — replace with real offline queue integration (CC-74/CC-75/CC-76)
export function useSyncStatus(): SyncStatusData {
  const [state, setState] = useState<SyncState>('synced')
  const [pendingCount, setPendingCount] = useState(0)
  const [conflictCount] = useState(0)

  const addPending = useCallback(() => {
    setPendingCount((n) => n + 1)
    setState('pending')
  }, [])

  const triggerSync = useCallback(() => {
    if (state !== 'pending') return
    setState('syncing')
    // Simulate async sync — replace with real POST /sync (CC-75)
    setTimeout(() => {
      setPendingCount(0)
      setState('synced')
    }, 1500)
  }, [state])

  return { state, pendingCount, conflictCount, triggerSync, addPending }
}
