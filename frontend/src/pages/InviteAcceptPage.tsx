import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { PasswordStrengthMeter, getPasswordStrength } from '@/components/ui/password-strength-meter'

interface InviteDetails {
  email: string
  name: string
  role: string
  branchName: string
}

// Stub — replace with real API call at CC-22: GET /invitations/validate?token=XYZ
function validateInviteToken(token: string): InviteDetails | null {
  if (!token || token.length < 8) return null
  return {
    email: 'newstaff@clinic.com',
    name: 'New Staff Member',
    role: 'professional',
    branchName: 'Main Branch',
  }
}

const ROLE_LABELS: Record<string, string> = {
  professional: 'Professional',
  secretary: 'Secretary',
  clinic_manager: 'Clinic Manager',
  org_admin: 'Org Admin',
}

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null) // null = validating
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { isLoading, error, clearError, acceptInvite } = useAuthStore()

  useEffect(() => {
    const details = validateInviteToken(token)
    setInviteDetails(details)
    setTokenValid(details !== null)
  }, [token])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearError()
    setFormError(null)

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }
    if (getPasswordStrength(password).label === 'Weak') {
      setFormError('Password is too weak. Add uppercase, numbers, or special characters.')
      return
    }

    await acceptInvite(token, password)
    if (!useAuthStore.getState().error) {
      navigate('/dashboard', { replace: true })
    }
  }

  if (tokenValid === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]" aria-label="Validating invite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle>Invitation Expired</CardTitle>
          </div>
          <CardDescription>This invitation link is no longer valid.</CardDescription>
        </CardHeader>
        <CardContent>
          <p role="alert" className="text-sm text-muted-foreground">
            Your invitation link has expired or is invalid. Please contact your clinic
            administrator to send a new invitation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          You've been invited to join ClinicAlly. Set up your password to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite summary */}
        <div className="rounded-md border p-4 space-y-1.5 bg-muted/40">
          <p className="text-sm font-medium">{inviteDetails!.name}</p>
          <p className="text-sm text-muted-foreground">{inviteDetails!.email}</p>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary">
              {ROLE_LABELS[inviteDetails!.role] ?? inviteDetails!.role}
            </Badge>
            <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
            <span className="text-xs text-muted-foreground">{inviteDetails!.branchName}</span>
          </div>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {(formError || error) && (
            <p role="alert" className="text-sm text-destructive">
              {formError ?? error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? 'Setting up account…' : 'Set Password & Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default InviteAcceptPage
