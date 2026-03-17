import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

type Section = 'General' | 'Branding' | 'Patient Permissions'

const SECTIONS: Section[] = ['General', 'Branding', 'Patient Permissions']

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Asia/Taipei']

function useSaveSuccess(): [boolean, () => void] {
  const [saved, setSaved] = useState(false)

  const trigger = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return [saved, trigger]
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('General')

  // General
  const [orgName, setOrgName] = useState('City Medical Clinic')
  const [contactEmail, setContactEmail] = useState('admin@citymedical.com')
  const [timezone, setTimezone] = useState('UTC')
  const [generalSaved, triggerGeneralSave] = useSaveSuccess()

  // Branding
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [brandingSaved, triggerBrandingSave] = useSaveSuccess()

  // Patient Permissions
  const [allowPatientUploads, setAllowPatientUploads] = useState(false)
  const [permissionsSaved, triggerPermissionsSave] = useSaveSuccess()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b pb-0">
        {SECTIONS.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeSection === section
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* General */}
      {activeSection === 'General' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
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
            <div className="flex items-center gap-3">
              <Button onClick={triggerGeneralSave}>Save</Button>
              {generalSaved && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branding */}
      {activeSection === 'Branding' && (
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <label
                htmlFor="brand-logo"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40"
              >
                <p className="text-sm text-muted-foreground">Click to upload logo</p>
                <input
                  id="brand-logo"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {logoFile && <p className="text-sm">Selected: {logoFile.name}</p>}
            </div>
            <Separator />
            <div className="space-y-1">
              <Label htmlFor="primary-color">Primary Color (hex)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  className="max-w-xs"
                />
                <div
                  className="h-8 w-8 rounded-md border border-border shrink-0"
                  style={{ backgroundColor: primaryColor }}
                  aria-label="Color preview"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={triggerBrandingSave}>Save</Button>
              {brandingSaved && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Permissions */}
      {activeSection === 'Patient Permissions' && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Allow patient file uploads</p>
                <p className="text-xs text-muted-foreground">
                  Patients can upload documents to their portal
                </p>
              </div>
              <button
                role="switch"
                aria-checked={allowPatientUploads}
                onClick={() => setAllowPatientUploads((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
                  allowPatientUploads ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    allowPatientUploads ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={triggerPermissionsSave}>Save</Button>
              {permissionsSaved && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
