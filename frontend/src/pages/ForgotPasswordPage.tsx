import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value.trim()
    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setIsLoading(true)
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)

    if (supabaseError) {
      setError('Something went wrong. Please try again.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              We've sent a password reset link to your email address.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive it? Check your spam folder or{' '}
          <button
            type="button"
            className="text-foreground font-medium hover:underline underline-offset-4"
            onClick={() => setSent(false)}
          >
            try again
          </button>
          .
        </p>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Icon + heading */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
          <Mail className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Forgot your password?
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@clinic.com"
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              className="pl-9"
            />
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
          {isLoading ? 'Sending…' : 'Send reset link'}
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </form>
    </div>
  )
}

export default ForgotPasswordPage
