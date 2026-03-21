import { create } from 'zustand'

export const ONBOARDING_STEPS = [
  { step: 1, label: 'Organization details', description: 'Name, timezone, contact info' },
  { step: 2, label: 'Upload logo',          description: 'Brand your organization' },
  { step: 3, label: 'First branch',         description: 'Add your clinic location' },
  { step: 4, label: 'Invite staff',         description: 'Bring your team on board' },
] as const

function storageKey(userId: string) {
  return `cc_onboarding_${userId}`
}

function loadCompleted(userId: string): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCompleted(userId: string, completed: Record<number, boolean>) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(completed))
  } catch { /* noop */ }
}

interface OnboardingStore {
  /** userId whose progress is currently loaded */
  userId: string | null
  completedSteps: Record<number, boolean>
  /** whether the checklist panel is expanded (session-only — resets on login) */
  isPanelOpen: boolean

  loadForUser: (userId: string) => void
  markStep: (step: number) => void
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  userId: null,
  completedSteps: {},
  isPanelOpen: false,

  loadForUser: (userId) => {
    const completedSteps = loadCompleted(userId)
    set({ userId, completedSteps, isPanelOpen: true })
  },

  markStep: (step) => {
    const { userId, completedSteps } = get()
    if (!userId) return
    const next = { ...completedSteps, [step]: true }
    set({ completedSteps: next })
    saveCompleted(userId, next)
  },

  openPanel:   () => set({ isPanelOpen: true }),
  closePanel:  () => set({ isPanelOpen: false }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
}))
