import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, Loader, RotateCcw } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

type StepStatus = 'pending' | 'running' | 'done' | 'failed'

interface ProvisioningStep {
  id: string
  label: string
  description: string
  status: StepStatus
  errorMessage?: string
  completedAt?: string
}

interface TenantProvision {
  tenantId: string
  orgName: string
  plan: string
  steps: ProvisioningStep[]
}

const MOCK_PROVISION: TenantProvision = {
  tenantId: 'northside-001',
  orgName: 'Northside Family Clinic',
  plan: 'Professional',
  steps: [
    {
      id: 'db-record',
      label: 'Create Tenant Record',
      description: 'Register tenant in database with plan assignment',
      status: 'done',
      completedAt: '2026-03-20 14:01',
    },
    {
      id: 'roles-seed',
      label: 'Seed Default Roles',
      description: 'Create org_admin, professional, receptionist, nurse roles',
      status: 'done',
      completedAt: '2026-03-20 14:01',
    },
    {
      id: 'storage-setup',
      label: 'Setup Storage Prefix',
      description: 'Register Supabase storage prefix for file isolation',
      status: 'failed',
      errorMessage: 'Supabase Storage API timeout after 10s. Retry to continue.',
    },
    {
      id: 'welcome-email',
      label: 'Send Welcome Email',
      description: 'Send onboarding email with login link to contact',
      status: 'pending',
    },
  ],
}

const STEP_ICONS: Record<StepStatus, React.ElementType> = {
  pending: Clock,
  running: Loader,
  done: CheckCircle,
  failed: XCircle,
}

const STEP_ICON_COLORS: Record<StepStatus, string> = {
  pending: 'text-muted-foreground',
  running: 'text-primary animate-spin',
  done: 'text-green-600',
  failed: 'text-destructive',
}

const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  pending: 'Waiting',
  running: 'Running',
  done: 'Complete',
  failed: 'Failed',
}

export function ProvisioningPage() {
  const user = useAuthStore((s) => s.user)
  const [provision, setProvision] = useState<TenantProvision>(MOCK_PROVISION)

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const allDone = provision.steps.every(s => s.status === 'done')
  const hasFailed = provision.steps.some(s => s.status === 'failed')

  const handleRetry = (stepId: string) => {
    setProvision(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.id === stepId ? { ...s, status: 'pending', errorMessage: undefined } : s
      ),
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Provisioning Status</h1>
        <div className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
          <span>Tenant:</span>
          <span className="font-medium text-foreground">{provision.orgName}</span>
          <Badge variant="outline">{provision.plan}</Badge>
        </div>
      </div>

      {/* Overall status */}
      <div className="flex items-center gap-3">
        {allDone && (
          <Badge className="bg-green-600 text-white">Provisioning Complete</Badge>
        )}
        {hasFailed && !allDone && (
          <Badge variant="destructive">Action Required — Step Failed</Badge>
        )}
        {!allDone && !hasFailed && (
          <Badge variant="outline">In Progress</Badge>
        )}
      </div>

      {/* Stepper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Steps</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {provision.steps.map((step, idx) => {
              const Icon = STEP_ICONS[step.status]
              return (
                <div key={step.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Step number + connector */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-border bg-background text-xs font-semibold text-muted-foreground">
                        {idx + 1}
                      </div>
                      {idx < provision.steps.length - 1 && (
                        <div className="w-px h-full min-h-[20px] bg-border mt-1" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className={cn('h-4 w-4 shrink-0', STEP_ICON_COLORS[step.status])} />
                        <span className="font-medium text-sm">{step.label}</span>
                        <Badge
                          variant={step.status === 'done' ? 'default' : step.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {STEP_STATUS_LABELS[step.status]}
                        </Badge>
                        {step.completedAt && (
                          <span className="text-xs text-muted-foreground ml-auto">{step.completedAt}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>

                      {step.status === 'failed' && step.errorMessage && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">
                            {step.errorMessage}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => handleRetry(step.id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Retry Step
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {allDone && (
        <Button>View Tenant Dashboard</Button>
      )}
    </div>
  )
}
