import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, X, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useOnboardingStore, ONBOARDING_STEPS } from '@/store/onboarding'

export function OnboardingChecklist() {
  const { user } = useAuth()
  const { loadForUser, completedSteps, isPanelOpen, openPanel, closePanel, togglePanel } =
    useOnboardingStore()
  const navigate = useNavigate()

  // Load persisted progress when the user is available
  useEffect(() => {
    if (user?.id) loadForUser(user.id)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Only show for org admins
  if (user?.role !== 'org_admin') return null

  const totalSteps     = ONBOARDING_STEPS.length
  const completedCount = ONBOARDING_STEPS.filter((s) => completedSteps[s.step]).length

  // Hide once everything is done
  if (completedCount === totalSteps) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Checklist panel */}
      {isPanelOpen && (
        <div className="w-72 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div>
              <p className="text-sm font-semibold">Finish setting up</p>
              <p className="text-xs opacity-75">
                {completedCount} of {totalSteps} steps done
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={closePanel}
              aria-label="Close checklist"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-primary/20">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <ul className="divide-y divide-border">
            {ONBOARDING_STEPS.map(({ step, label, description }) => {
              const done = !!completedSteps[step]
              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => navigate(`/onboarding?step=${step}`)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      done && 'opacity-60'
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className={cn('text-sm font-medium text-foreground', done && 'line-through')}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border">
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                closePanel()
                navigate('/onboarding')
              }}
            >
              Continue setup
            </Button>
          </div>
        </div>
      )}

      {/* Bubble toggle */}
      <button
        type="button"
        onClick={isPanelOpen ? closePanel : openPanel}
        aria-label="Setup checklist"
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        <ClipboardList className="h-5 w-5" />
        {/* Progress badge */}
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary text-[10px] font-bold text-primary leading-none">
          {completedCount}/{totalSteps}
        </span>
      </button>
    </div>
  )
}
