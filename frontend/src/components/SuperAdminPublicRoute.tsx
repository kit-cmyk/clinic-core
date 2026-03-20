import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import type { ReactNode } from 'react'

interface SuperAdminPublicRouteProps {
  children: ReactNode
}

/**
 * Route guard for the super-admin login page.
 * Redirects to /admin/plans if already authenticated as SUPER_ADMIN,
 * otherwise renders the page (allowing other authenticated users to log
 * into the admin portal separately).
 */
export function SuperAdminPublicRoute({ children }: SuperAdminPublicRouteProps) {
  const user          = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized   = useAuthStore((s) => s.isInitialized)

  if (!isInitialized) return null

  if (isAuthenticated && user?.role === 'super_admin') {
    return <Navigate to="/admin/plans" replace />
  }

  return <>{children}</>
}
