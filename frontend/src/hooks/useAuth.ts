import { useState } from 'react'
import type { User } from '@/types'

// Stub — replace with real Supabase auth once CC-14 + CC-18 are complete
const MOCK_USER: User = {
  id: 'mock-user-1',
  email: 'admin@demo-clinic.com',
  name: 'Demo Admin',
  role: 'org_admin',
  tenantId: 'demo-tenant-1',
  branchId: 'demo-branch-1',
}

export function useAuth() {
  const [user] = useState<User | null>(MOCK_USER)
  const [isLoading] = useState(false)

  const logout = () => {
    localStorage.removeItem('cc_token')
    window.location.href = '/login'
  }

  return { user, isLoading, logout }
}
