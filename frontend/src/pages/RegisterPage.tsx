import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Info, MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

type AccountType = 'org_admin' | 'staff'

const ROLE_OPTIONS = [
  {
    type: 'org_admin' as AccountType,
    label: 'Organization Admin',
    description: 'Set up ClinicCore for your clinic or practice. You will manage staff, branches, and settings.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Doctor / Nurse',
    description: 'Clinical staff. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Receptionist',
    description: 'Front desk and scheduling staff. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Lab Technician',
    description: 'Laboratory and results management. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Branch Manager',
    description: 'Manage a specific clinic branch. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Other Staff',
    description: 'Any other role within your organization. Accounts are created by your organization admin via an email invitation.',
  },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const selected = selectedIndex !== null ? ROLE_OPTIONS[selectedIndex] : null
  const isOrgAdmin = selected?.type === 'org_admin'
  const isStaff = selected?.type === 'staff'

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearError()
    setPasswordError(null)

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
    const clinicName = (form.elements.namedItem('clinicName') as HTMLInputElement).value.trim()
    const clinicAddress = (form.elements.namedItem('clinicAddress') as HTMLInputElement).value.trim()
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    await register(name, email, password, clinicName, clinicAddress)
    if (!useAuthStore.getState().error) {
      navigate('/onboarding', { replace: true })
    }
  }

  const displayError = passwordError ?? error

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">

        {/* Branding */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="text-base font-semibold text-foreground">ClinicCore</span>
        </div>

        {/* Two-panel card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col sm:flex-row min-h-[420px]">

          {/* Left — role selection */}
          <div className="w-full sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-secondary/40 flex flex-col p-5 gap-4">
            <div>
              <h1 className="text-sm font-semibold text-foreground">Create your account</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Select your role to get started.</p>
            </div>

            <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
              {ROLE_OPTIONS.map((option, idx) => {
                const active = selectedIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      'group relative flex items-center justify-between px-3 py-2.5 text-left transition-colors',
                      active ? 'bg-background' : 'bg-card hover:bg-background/60'
                    )}
                  >
                    <span className={cn('text-xs', active ? 'font-medium text-foreground' : 'text-foreground/70')}>
                      {option.label}
                    </span>

                    <span className="relative ml-2 shrink-0">
                      <Info className="size-3 text-muted-foreground" />
                      <span
                        role="tooltip"
                        className={cn(
                          'pointer-events-none absolute right-0 w-48 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 z-10',
                          idx >= ROLE_OPTIONS.length - 2 ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                        )}
                      >
                        {option.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-auto">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground font-medium hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          {/* Right — form or notice */}
          <div className="flex-1 flex flex-col justify-center p-6">
            {!selected && (
              <p className="text-sm text-muted-foreground text-center">
                Select your role on the left to continue.
              </p>
            )}

            {isStaff && (
              <div className="flex flex-col items-center gap-4 text-center max-w-xs mx-auto">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <MailOpen className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Invitation required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Staff accounts are set up by your organization admin. Ask them to invite you from{' '}
                    <span className="font-medium text-foreground">Staff → User Management</span>
                    {' '}— you'll receive a setup link by email.
                  </p>
                </div>
              </div>
            )}

            {isOrgAdmin && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organization</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="clinicName">Clinic / practice name</Label>
                    <Input
                      id="clinicName"
                      name="clinicName"
                      type="text"
                      placeholder="Sunridge Medical Centre"
                      autoComplete="organization"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="clinicAddress">Address</Label>
                    <Input
                      id="clinicAddress"
                      name="clinicAddress"
                      type="text"
                      placeholder="123 Health St, Cape Town, 8001"
                      autoComplete="street-address"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your account</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Jane Smith"
                      autoComplete="name"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jane@clinic.com"
                      autoComplete="email"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Min. 8 chars"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                </div>

                {displayError && (
                  <p role="alert" className="text-sm text-destructive">
                    {displayError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" />}
                  {isLoading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
