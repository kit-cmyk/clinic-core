import { type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, User, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearError()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    if (!email || !password) {
      useAuthStore.setState({ error: 'Please enter your email and password.' })
      return
    }

    await login(email, password)
    if (!useAuthStore.getState().error) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="space-y-7">
      {/* Avatar + heading */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
          <User className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Login to your account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your details to login.</p>
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
              disabled={isLoading}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
              tabIndex={-1}
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
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
          {isLoading ? 'Signing in…' : 'Login'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
