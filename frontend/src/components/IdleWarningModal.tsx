import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const WARNING_SECONDS = 120

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function IdleWarningModal() {
  const [open, setOpen]           = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS)

  // Listen for hook events
  useEffect(() => {
    const handleWarning = () => {
      setSecondsLeft(WARNING_SECONDS)
      setOpen(true)
    }
    const handleReset = () => setOpen(false)

    window.addEventListener('idle-warning', handleWarning)
    window.addEventListener('idle-reset', handleReset)
    return () => {
      window.removeEventListener('idle-warning', handleWarning)
      window.removeEventListener('idle-reset', handleReset)
    }
  }, [])

  // Countdown ticker
  useEffect(() => {
    if (!open) return
    const interval = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [open])

  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            You'll be logged out due to inactivity in{' '}
            <span
              aria-live="assertive"
              aria-atomic="true"
              className="font-semibold tabular-nums"
            >
              {formatCountdown(secondsLeft)}
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/*
            Clicking this button fires a 'click' event that bubbles to window.
            useIdleLogout listens for 'click' on window and resets the idle timer,
            which in turn dispatches 'idle-reset' to close this modal.
          */}
          <Button>Stay Logged In</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
