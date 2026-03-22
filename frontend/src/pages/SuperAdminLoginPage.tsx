import { type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'

export function SuperAdminLoginPage() {
  const navigate = useNavigate()
  const { loginSuperAdmin, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearError()
    const form = e.currentTarget
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    if (!email || !password) {
      useAuthStore.setState({ error: 'Please enter your email and password.' })
      return
    }

    await loginSuperAdmin(email, password)
    if (!useAuthStore.getState().error) {
      navigate('/admin/monitoring', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-zinc-300" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">ClinicAlly</h1>
          <p className="text-sm text-zinc-500">Platform Administration</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-zinc-100">Administrator sign in</CardTitle>
            <CardDescription className="text-zinc-400">
              Restricted to platform administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@cliniccore.io"
                  autoComplete="email"
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="animate-spin" />}
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SuperAdminLoginPage
