import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useEffect, useState, type ReactNode } from 'react'

interface PublicRouteProps {
  children: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized   = useAuthStore((s) => s.isInitialized)
  const [timedOut, setTimedOut]     = useState(false)

  // Safety valve: if Supabase never fires INITIAL_SESSION (e.g. missing env vars),
  // stop blocking after 3 s and just render the public page.
  useEffect(() => {
    if (isInitialized) return
    const id = setTimeout(() => setTimedOut(true), 3000)
    return () => clearTimeout(id)
  }, [isInitialized])

  if (!isInitialized && !timedOut) return null

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
