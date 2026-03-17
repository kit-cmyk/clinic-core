import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'

const STEPS = [
  { number: 1, name: 'Org Details' },
  { number: 2, name: 'Logo' },
  { number: 3, name: 'First Branch' },
  { number: 4, name: 'Invite Staff' },
]

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Taipei',
]

const STAFF_ROLES = ['professional', 'secretary', 'clinic_manager'] as const

export function OnboardingPage() {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(1)

  // Step 1
  const [orgName, setOrgName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [website, setWebsite] = useState('')

  // Step 2
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Step 3
  const [branchName, setBranchName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')

  // Step 4
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<typeof STAFF_ROLES[number]>('professional')

  if (user?.role !== 'org_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Organization Setup</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 ${
                step === s.number
                  ? 'bg-primary text-primary-foreground border-primary'
                  : step > s.number
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {s.number}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                step === s.number ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s.name}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Step {step}: {STEPS[step - 1].name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Org Details */}
          {step === 1 && (
            <>
              <div className="space-y-1">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Clinic"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@myclinic.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myclinic.com"
                />
              </div>
            </>
          )}

          {/* Step 2: Logo */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload your organization logo (PNG, JPG, JPEG, or WebP).
              </p>
              <label
                htmlFor="logo-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">.png, .jpg, .jpeg, .webp</p>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {logoFile && (
                <p className="text-sm text-foreground">Selected: <span className="font-medium">{logoFile.name}</span></p>
              )}
            </div>
          )}

          {/* Step 3: First Branch */}
          {step === 3 && (
            <>
              <div className="space-y-1">
                <Label htmlFor="branch-name">Branch Name</Label>
                <Input
                  id="branch-name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Main Branch"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Address Line 1</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-phone">Phone</Label>
                <Input
                  id="branch-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </>
          )}

          {/* Step 4: Invite Staff */}
          {step === 4 && (
            <>
              <div className="space-y-1">
                <Label htmlFor="invite-email">Invite Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@myclinic.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof STAFF_ROLES[number])}
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {step < 4 && (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            )}
            {step === 4 && (
              <>
                <Button>Finish Setup</Button>
                <Button variant="outline">Skip for now</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
