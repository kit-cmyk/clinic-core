import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'

const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

/**
 * Logs the user out after `timeoutMs` of inactivity.
 * Resets the timer on any user interaction.
 *
 * @param timeoutMs - Inactivity threshold in milliseconds (default: 15 minutes)
 */
export function useIdleLogout(timeoutMs = 15 * 60 * 1000) {
  const logout = useAuthStore((s) => s.logout)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current)
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
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [logout, timeoutMs])
}
