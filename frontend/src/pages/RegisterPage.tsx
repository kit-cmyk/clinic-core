import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Info, MailOpen, ChevronLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const registerSchema = z.object({
  name:            z.string().min(1, 'Full name is required'),
  clinicName:      z.string().min(1, 'Clinic name is required'),
  clinicAddress:   z.string().min(1, 'Address is required'),
  email:           z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterFields = z.infer<typeof registerSchema>

type AccountType = 'org_admin' | 'staff'

const ROLE_OPTIONS = [
  {
    type: 'org_admin' as AccountType,
    label: 'Organization Admin',
    description:
      'Set up ClinicAlly for your clinic or practice. You will manage staff, branches, and settings.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Doctor / Nurse',
    description:
      'Clinical staff. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Receptionist',
    description:
      'Front desk and scheduling staff. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Lab Technician',
    description:
      'Laboratory and results management. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Branch Manager',
    description:
      'Manage a specific clinic branch. Accounts are created by your organization admin via an email invitation.',
  },
  {
    type: 'staff' as AccountType,
    label: 'Other Staff',
    description:
      'Any other role within your organization. Accounts are created by your organization admin via an email invitation.',
  },
]

function DecorativePanel() {
  return (
    <div
      className="hidden lg:block lg:w-[44%] relative overflow-hidden rounded-3xl m-4"
      style={{
        background:
          'linear-gradient(140deg, #6ee7b7 0%, #34d399 18%, #10b981 36%, #2dd4bf 52%, #a7f3d0 70%, #d1fae5 85%, #6ee7b7 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 28% 72%, rgba(180,240,160,0.38) 0%, transparent 52%), radial-gradient(ellipse at 74% 24%, rgba(20,180,160,0.36) 0%, transparent 52%)',
        }}
      />

      {/* Subtle medical cross */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="155" y="60" width="90" height="280" rx="18" fill="white" />
        <rect x="60" y="155" width="280" height="90" rx="18" fill="white" />
      </svg>

      <div
        className="absolute"
        style={{
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 36% 33%, rgba(240,255,250,0.95) 0%, rgba(167,243,208,0.96) 28%, rgba(52,211,153,0.97) 58%, rgba(16,185,129,1) 80%, rgba(5,150,105,1) 100%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow:
            '0 32px 100px rgba(16,185,129,0.28), inset 0 -10px 36px rgba(5,120,80,0.15)',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '66px',
          height: '66px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 34% 30%, rgba(245,255,252,0.97) 0%, rgba(167,243,208,0.97) 44%, rgba(45,212,191,1) 100%)',
          top: '21%',
          right: '27%',
          boxShadow: '0 10px 34px rgba(20,184,166,0.28)',
        }}
      />
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: authRegister, isLoading, error, clearError } = useAuthStore()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selected = selectedIndex !== null ? ROLE_OPTIONS[selectedIndex] : null
  const isOrgAdmin = selected?.type === 'org_admin'
  const isStaff = selected?.type === 'staff'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFields) => {
    clearError()
    await authRegister(data.name, data.email, data.password, data.clinicName, data.clinicAddress)
    if (!useAuthStore.getState().error) {
      navigate('/onboarding', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-100/80 dark:bg-zinc-900">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-h-screen overflow-y-auto">
        {/* Top nav */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-foreground">ClinicAlly</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start justify-center px-6 py-8">
          <div className="w-full max-w-2xl space-y-6">
            {/* Heading */}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Select your role to get started.
              </p>
            </div>

            {/* Role selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((option, idx) => {
                const active = selectedIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      'group relative flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-all',
                      active
                        ? 'border-primary bg-primary/5 text-foreground font-medium'
                        : 'border-border bg-card text-foreground/70 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-zinc-900'
                    )}
                  >
                    <span>{option.label}</span>
                    <span className="relative ml-2 shrink-0">
                      <Info className="size-3 text-muted-foreground" />
                      <span
                        role="tooltip"
                        className={cn(
                          'pointer-events-none absolute right-0 w-52 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 z-10',
                          idx >= ROLE_OPTIONS.length - 3 ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                        )}
                      >
                        {option.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Right panel — form or notice */}
            {!selected && (
              <p className="text-sm text-muted-foreground py-4">
                Select your role above to continue.
              </p>
            )}

            {isStaff && (
              <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto py-6">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <MailOpen className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Invitation required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Staff accounts are set up by your organization admin. Ask them to invite you
                    from{' '}
                    <span className="font-medium text-foreground">Staff → User Management</span>
                    {' '}— you'll receive a setup link by email.
                  </p>
                </div>
              </div>
            )}

            <div className={isOrgAdmin ? '' : 'hidden'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to role selection
                </button>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Organization
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="clinicName">
                        Clinic / practice name <span aria-hidden="true" className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="clinicName"
                        type="text"
                        placeholder="Sunridge Medical Centre"
                        autoComplete="organization"
                        disabled={isLoading}
                        aria-describedby={errors.clinicName ? 'clinicName-error' : undefined}
                        {...register('clinicName')}
                      />
                      {errors.clinicName && (
                        <p id="clinicName-error" role="alert" className="text-xs text-destructive">
                          {errors.clinicName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="clinicAddress">
                        Address <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="clinicAddress"
                        type="text"
                        placeholder="123 Health St, Cape Town, 8001"
                        autoComplete="street-address"
                        disabled={isLoading}
                        aria-describedby={errors.clinicAddress ? 'clinicAddress-error' : undefined}
                        {...register('clinicAddress')}
                      />
                      {errors.clinicAddress && (
                        <p id="clinicAddress-error" role="alert" className="text-xs text-destructive">
                          {errors.clinicAddress.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your account
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">
                        Full name <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Jane Smith"
                        autoComplete="name"
                        disabled={isLoading}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p id="name-error" role="alert" className="text-xs text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">
                        Work email <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@clinic.com"
                        autoComplete="email"
                        disabled={isLoading}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p id="email-error" role="alert" className="text-xs text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password">
                        Password <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <PasswordInput
                        id="password"
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        disabled={isLoading}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                        {...register('password')}
                      />
                      {errors.password && (
                        <p id="password-error" role="alert" className="text-xs text-destructive">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">
                        Confirm password <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <PasswordInput
                        id="confirmPassword"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                        {...register('confirmPassword')}
                      />
                      {errors.confirmPassword && (
                        <p id="confirmPassword-error" role="alert" className="text-xs text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-medium"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="animate-spin" />}
                  {isLoading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 shrink-0">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ClinicAlly
          </p>
        </div>
      </div>

      {/* Right decorative gradient panel */}
      <DecorativePanel />
    </div>
  )
}

export default RegisterPage
