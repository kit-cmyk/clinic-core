import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useEffect, useState } from 'react'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized   = useAuthStore((s) => s.isInitialized)
  const location        = useLocation()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (isInitialized) return
    const id = setTimeout(() => setTimedOut(true), 3000)
    return () => clearTimeout(id)
  }, [isInitialized])

  if (!isInitialized && !timedOut) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
