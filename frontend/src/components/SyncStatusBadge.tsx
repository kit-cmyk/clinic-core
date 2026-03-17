import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { SyncStatusData } from '@/hooks/useSyncStatus'

interface SyncStatusBadgeProps {
  sync: SyncStatusData
}

export function SyncStatusBadge({ sync }: SyncStatusBadgeProps) {
  const { state, pendingCount, conflictCount, triggerSync } = sync
  const [expanded, setExpanded] = useState(false)

  const label = (() => {
    if (state === 'syncing') return 'Syncing...'
    if (state === 'conflict') return `Conflict (${conflictCount})`
    if (state === 'pending') return `Pending (${pendingCount})`
    return 'Synced'
  })()

  const badgeVariant = (() => {
    if (state === 'conflict') return 'destructive' as const
    if (state === 'pending' || state === 'syncing') return 'secondary' as const
    return 'outline' as const
  })()

  return (
    <div className="relative">
      <button
        aria-label={`Sync status: ${label}`}
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5"
      >
        {state === 'syncing' && (
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        )}
        {state === 'synced' && (
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        )}
        {state === 'pending' && (
          <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
        )}
        {state === 'conflict' && (
          <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
        )}
        <Badge variant={badgeVariant} className="text-xs cursor-pointer">
          {label}
        </Badge>
      </button>

      {expanded && (
        <Card className="absolute right-0 top-8 z-50 w-64 shadow-lg">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Sync Status</p>
            {state === 'synced' && (
              <p className="text-xs text-muted-foreground">All changes are saved.</p>
            )}
            {state === 'pending' && (
              <>
                <p className="text-xs text-muted-foreground">
                  {pendingCount} change{pendingCount !== 1 ? 's' : ''} waiting to sync.
                </p>
                <Button size="sm" className="w-full text-xs" onClick={() => { triggerSync(); setExpanded(false) }}>
                  Sync now
                </Button>
              </>
            )}
            {state === 'syncing' && (
              <p className="text-xs text-muted-foreground">Syncing changes to server…</p>
            )}
            {state === 'conflict' && (
              <p className="text-xs text-destructive">
                {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} need resolution.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
