import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'

const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

/** How long before logout to show the warning modal */
const WARNING_BEFORE_MS = 2 * 60 * 1000

/**
 * Logs the user out after `timeoutMs` of inactivity.
 * Resets the timer on any user interaction.
 * Dispatches `idle-warning` 2 minutes before logout and `idle-reset` on activity.
 *
 * @param timeoutMs - Inactivity threshold in milliseconds (default: 15 minutes)
 */
export function useIdleLogout(timeoutMs = 15 * 60 * 1000) {
  const logout = useAuthStore((s) => s.logout)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current)     clearTimeout(timerRef.current)
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current)

      // Dismiss any active warning
      window.dispatchEvent(new CustomEvent('idle-reset'))

      // Schedule warning at T-2 min
      const warnAt = timeoutMs - WARNING_BEFORE_MS
      if (warnAt > 0) {
        warnTimerRef.current = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('idle-warning'))
        }, warnAt)
      }

      // Schedule logout
      timerRef.current = setTimeout(() => {
        logout()
      }, timeoutMs)
    }

    // Start the timer immediately
    resetTimer()

    // Reset on any user interaction
    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      if (timerRef.current)     clearTimeout(timerRef.current)
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [logout, timeoutMs])
}
