import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  acceptInvite: (token: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const MOCK_JWT = 'mock.jwt.token'

// Rehydrate from sessionStorage on load
const storedToken = sessionStorage.getItem('cc_token')
const storedUser = sessionStorage.getItem('cc_user')

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  token: storedToken ?? null,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    // Stub — replace body with real Supabase call at CC-18:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    await new Promise((r) => setTimeout(r, 700))

    if (!email || password.length < 6) {
      set({ isLoading: false, error: 'Invalid email or password.' })
      return
    }

    const mockUser: User = {
      id: 'mock-user-1',
      email,
      name: email.split('@')[0].replace(/[._]/g, ' '),
      role: 'org_admin',
      tenantId: 'demo-tenant-1',
      branchId: 'demo-branch-1',
    }

    sessionStorage.setItem('cc_token', MOCK_JWT)
    sessionStorage.setItem('cc_user', JSON.stringify(mockUser))

    set({ user: mockUser, token: MOCK_JWT, isAuthenticated: true, isLoading: false })
  },

  // Stub — replace body with real Supabase invite acceptance at CC-22:
  // const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'invite' })
  acceptInvite: async (_token: string, _password: string) => {
    set({ isLoading: true, error: null })
    await new Promise((r) => setTimeout(r, 700))

    const mockUser: User = {
      id: 'mock-invite-user-1',
      email: 'newstaff@clinic.com',
      name: 'New Staff Member',
      role: 'professional',
      tenantId: 'demo-tenant-1',
      branchId: 'demo-branch-1',
    }

    sessionStorage.setItem('cc_token', MOCK_JWT)
    sessionStorage.setItem('cc_user', JSON.stringify(mockUser))
    set({ user: mockUser, token: MOCK_JWT, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    sessionStorage.removeItem('cc_token')
    sessionStorage.removeItem('cc_user')
    set({ user: null, token: null, isAuthenticated: false, error: null })
  },

  clearError: () => set({ error: null }),
}))
