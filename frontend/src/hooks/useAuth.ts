import { useAuthStore } from '@/store/auth'

// Re-exports the Zustand store as a hook — single import point for all auth state
export function useAuth() {
  return useAuthStore()
}
