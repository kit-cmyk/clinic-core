import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, KeyRound, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

type PageState = 'waiting' | 'ready' | 'success' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<PageState>('waiting')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready')
      }
    })

    // If the hash has already been consumed before this component mounted,
    // check for an active session (Supabase sets it from the recovery fragment).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPageState('ready')
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm  = (form.elements.namedItem('confirm') as HTMLInputElement).value

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (updateError) {
      setError('Failed to update password. The link may have expired.')
      return
    }

    // Sign out so the user logs in fresh with their new password
    await supabase.auth.signOut()
    setPageState('success')
  }

  if (pageState === 'waiting') {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying reset link…</p>
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div className="space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <KeyRound className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Link expired
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              This password reset link is invalid or has expired.
            </p>
          </div>
        </div>
        <Button
          className="w-full h-11"
          onClick={() => navigate('/forgot-password')}
        >
          Request a new link
        </Button>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Password updated
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your password has been changed successfully.
            </p>
          </div>
        </div>
        <Button
          className="w-full h-11"
          onClick={() => navigate('/login', { replace: true })}
        >
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Icon + heading */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
          <KeyRound className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Set new password
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong password for your account.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
          />
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
          {isLoading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  )
}

export default ResetPasswordPage
