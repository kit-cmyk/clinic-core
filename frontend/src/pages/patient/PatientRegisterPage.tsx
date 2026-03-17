import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Stub — replace at CC-41 with real token validation
function validateToken(token: string | null): { valid: boolean; name: string; clinicName: string } {
  if (!token || token.length < 8) {
    return { valid: false, name: '', clinicName: '' }
  }
  return { valid: true, name: 'John Doe', clinicName: 'City Clinic' }
}

function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

export default function PatientRegisterPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { valid, name, clinicName } = validateToken(token)

  const [fullName, setFullName] = useState(name)
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  if (!valid) {
    return (
      <PatientLayout>
        <Card>
          <CardHeader>
            <CardTitle>Invalid or Expired Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This registration link is invalid or has expired. Please contact your clinic for a new
              invitation link.
            </p>
          </CardContent>
        </Card>
      </PatientLayout>
    )
  }

  if (success) {
    return (
      <PatientLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-green-600 font-medium">
              Account created! Redirecting…
            </p>
          </CardContent>
        </Card>
      </PatientLayout>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!fullName.trim()) errs.push('Full name is required.')
    if (!dob) errs.push('Date of birth is required.')
    if (!gender) errs.push('Gender is required.')
    if (password.length < 8) errs.push('Password must be at least 8 characters.')
    if (password !== confirmPassword) errs.push('Passwords do not match.')
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setSuccess(true)
  }

  return (
    <PatientLayout>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {name}</CardTitle>
          <p className="text-sm text-muted-foreground">{clinicName}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {errors.length > 0 && (
              <div role="alert" className="text-sm text-destructive space-y-1">
                {errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
        </CardContent>
      </Card>
    </PatientLayout>
  )
}
