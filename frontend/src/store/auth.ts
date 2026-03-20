import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Role } from '@/types'

const API = import.meta.env.VITE_API_URL as string

// ── Role mapping ──────────────────────────────────────────────────────────────
// Backend uses UPPER_SNAKE (Prisma enum); frontend uses lower_snake.
// SECRETARY maps to receptionist — the clerk/front-desk role in the UI.
function normalizeRole(backendRole: string): Role {
  const map: Record<string, Role> = {
    SUPER_ADMIN: 'super_admin',
    ORG_ADMIN:   'org_admin',
    DOCTOR:      'doctor',
    NURSE:       'nurse',
    SECRETARY:   'receptionist',
    PATIENT:     'patient',
  }
  return map[backendRole] ?? 'patient'
}

async function fetchProfile(accessToken: string): Promise<User> {
  const res = await fetch(`${API}/api/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user profile')
  const data = await res.json()
  return {
    id:       data.id,
    email:    data.email ?? '',
    name:     `${data.firstName} ${data.lastName}`.trim(),
    role:     normalizeRole(data.role),
    tenantId: data.tenantId,
    orgName:    data.orgName ?? undefined,
    orgAddress: data.orgAddress ?? undefined,
    branchId: data.branchId ?? undefined,
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user:            User | null
  token:           string | null
  isAuthenticated: boolean
  isLoading:       boolean   // true while a login/register/acceptInvite call is in flight
  isInitialized:   boolean   // true once INITIAL_SESSION has resolved — used by route guards
  error:           string | null

  login:        (email: string, password: string) => Promise<void>
  register:     (name: string, email: string, password: string, clinicName: string, clinicAddress: string) => Promise<void>
  acceptInvite: (token: string, password: string) => Promise<void>
  logout:       () => Promise<void>
  clearError:   () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  token:           null,
  isAuthenticated: false,
  isLoading:       false,
  isInitialized:   false,    // false until INITIAL_SESSION resolves
  error:           null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ isLoading: false, error: 'Invalid email or password.' })
      return
    }

    try {
      const user = await fetchProfile(data.session.access_token)
      set({ user, token: data.session.access_token, isAuthenticated: true, isLoading: false })
    } catch {
      await supabase.auth.signOut()
      set({ isLoading: false, error: 'Failed to load account. Please try again.' })
    }
  },

  register: async (name, email, password, clinicName, clinicAddress) => {
    set({ isLoading: true, error: null })

    const parts     = name.trim().split(/\s+/)
    const firstName = parts[0]
    const lastName  = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]

    try {
      const res = await fetch(`${API}/api/v1/auth/register-org`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, firstName, lastName, clinicName, clinicAddress }),
      })
      const json = await res.json()

      if (!res.ok) {
        set({ isLoading: false, error: json.message ?? 'Registration failed.' })
        return
      }

      // Hydrate the Supabase client with the returned session tokens
      await supabase.auth.setSession({
        access_token:  json.access_token,
        refresh_token: json.refresh_token,
      })

      const user = await fetchProfile(json.access_token)
      set({ user, token: json.access_token, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Registration failed. Please try again.' })
    }
  },

  acceptInvite: async (inviteToken, password) => {
    set({ isLoading: true, error: null })

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: inviteToken,
      type:       'invite',
    })

    if (error || !data.session) {
      set({ isLoading: false, error: 'Invalid or expired invitation link.' })
      return
    }

    // Set new password after verifying the invite OTP
    await supabase.auth.updateUser({ password })

    try {
      const user = await fetchProfile(data.session.access_token)
      set({ user, token: data.session.access_token, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Failed to load account.' })
    }
  },

  logout: async () => {
    // Clear state optimistically so routes redirect immediately
    set({ user: null, token: null, isAuthenticated: false, error: null })
    await supabase.auth.signOut()
  },

  clearError: () => set({ error: null }),
}))

// ── Session lifecycle ─────────────────────────────────────────────────────────
// INITIAL_SESSION fires immediately on listener registration — handles page reload.
// TOKEN_REFRESHED keeps the stored token current.
// SIGNED_OUT clears state if revoked externally (e.g. another tab).
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'INITIAL_SESSION') {
    if (session?.access_token) {
      try {
        const user = await fetchProfile(session.access_token)
        useAuthStore.setState({ user, token: session.access_token, isAuthenticated: true, isInitialized: true })
      } catch {
        useAuthStore.setState({ isInitialized: true })
      }
    } else {
      useAuthStore.setState({ isInitialized: true })
    }
    return
  }

  if (event === 'TOKEN_REFRESHED' && session?.access_token) {
    useAuthStore.setState({ token: session.access_token })
    return
  }

  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  }
})
