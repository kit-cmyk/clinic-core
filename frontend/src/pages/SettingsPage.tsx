import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { UserManagementPage } from '@/pages/UserManagementPage'

type Section = 'General' | 'Branding' | 'Patient Permissions' | 'Branches' | 'Users'

const SECTIONS: Section[] = ['General', 'Branding', 'Patient Permissions', 'Branches', 'Users']

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Asia/Taipei']

function useSaveSuccess(): [boolean, () => void] {
  const [saved, setSaved] = useState(false)
  const trigger = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return [saved, trigger]
}

// ── Branches Section ───────────────────────────────────────────────────────────

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
  status: 'Active' | 'Inactive'
}

const INITIAL_BRANCHES: Branch[] = [
  { id: '1', name: 'Main Branch',       address: '123 Main St',   city: 'New York', phone: '+1 555 100 0001', status: 'Active'   },
  { id: '2', name: 'Downtown Clinic',   address: '456 Park Ave',  city: 'New York', phone: '+1 555 200 0002', status: 'Active'   },
  { id: '3', name: 'Westside Location', address: '789 West Blvd', city: 'Brooklyn', phone: '+1 555 300 0003', status: 'Inactive' },
]

interface BranchForm { name: string; address: string; city: string; phone: string; timezone: string }
const emptyBranchForm: BranchForm = { name: '', address: '', city: '', phone: '', timezone: 'UTC' }

function BranchesSection() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyBranchForm)

  const openAdd = () => {
    setEditBranch(null)
    setForm(emptyBranchForm)
    setSheetOpen(true)
  }

  const openEdit = (b: Branch) => {
    setEditBranch(b)
    setForm({ name: b.name, address: b.address, city: b.city, phone: b.phone, timezone: 'UTC' })
    setSheetOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editBranch) {
      setBranches(prev => prev.map(b => b.id === editBranch.id ? { ...b, ...form } : b))
    } else {
      setBranches(prev => [...prev, { id: Date.now().toString(), name: form.name, address: form.address, city: form.city, phone: form.phone, status: 'Active' }])
    }
    setSheetOpen(false)
  }

  const toggleStatus = (id: string) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' } : b))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Branches</p>
          <p className="text-xs text-muted-foreground">{branches.filter(b => b.status === 'Active').length} active branches</p>
        </div>
        <Button size="sm" onClick={openAdd}>+ New Branch</Button>
      </div>

      <div className="space-y-2">
        {branches.map(b => (
          <div key={b.id} className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.address}, {b.city} · {b.phone}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={b.status === 'Active' ? 'default' : 'secondary'}>{b.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(b)}>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={b.status === 'Active' ? 'text-destructive focus:text-destructive' : ''}
                    onClick={() => toggleStatus(b.id)}
                  >
                    {b.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editBranch ? 'Edit Branch' : 'New Branch'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="bs-name">Branch Name</Label>
              <Input id="bs-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Branch name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-phone">Phone</Label>
              <Input id="bs-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-address">Address</Label>
              <Input id="bs-address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-city">City</Label>
              <Input id="bs-city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New York" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-tz">Timezone</Label>
              <Input id="bs-tz" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} placeholder="UTC" />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave}>{editBranch ? 'Save Changes' : 'Create Branch'}</Button>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('General')

  // General
  const [orgName,       setOrgName]       = useState('City Medical Clinic')
  const [contactEmail,  setContactEmail]  = useState('admin@citymedical.com')
  const [timezone,      setTimezone]      = useState('UTC')
  const [generalSaved,  triggerGeneralSave] = useSaveSuccess()

  // Branding
  const [logoFile,     setLogoFile]     = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [brandingSaved, triggerBrandingSave] = useSaveSuccess()

  // Patient Permissions
  const [allowPatientUploads, setAllowPatientUploads] = useState(false)
  const [permissionsSaved, triggerPermissionsSave] = useSaveSuccess()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b pb-0 flex-wrap">
        {SECTIONS.map(section => (
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
        <Card className="max-w-2xl">
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" value={orgName} onChange={e => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input id="contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={triggerGeneralSave}>Save</Button>
              {generalSaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branding */}
      {activeSection === 'Branding' && (
        <Card className="max-w-2xl">
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <label
                htmlFor="brand-logo"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40"
              >
                <p className="text-sm text-muted-foreground">Click to upload logo</p>
                <input id="brand-logo" type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
              </label>
              {logoFile && <p className="text-sm">Selected: {logoFile.name}</p>}
            </div>
            <Separator />
            <div className="space-y-1">
              <Label htmlFor="primary-color">Primary Color (hex)</Label>
              <div className="flex items-center gap-3">
                <Input id="primary-color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#2563eb" className="max-w-xs" />
                <div className="h-8 w-8 rounded-md border border-border shrink-0" style={{ backgroundColor: primaryColor }} aria-label="Color preview" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={triggerBrandingSave}>Save</Button>
              {brandingSaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Permissions */}
      {activeSection === 'Patient Permissions' && (
        <Card className="max-w-2xl">
          <CardHeader><CardTitle>Patient Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Allow patient file uploads</p>
                <p className="text-xs text-muted-foreground">Patients can upload documents to their portal</p>
              </div>
              <button
                role="switch"
                aria-checked={allowPatientUploads}
                onClick={() => setAllowPatientUploads(v => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${allowPatientUploads ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${allowPatientUploads ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={triggerPermissionsSave}>Save</Button>
              {permissionsSaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branches */}
      {activeSection === 'Branches' && (
        <Card>
          <CardHeader><CardTitle>Branch Management</CardTitle></CardHeader>
          <CardContent>
            <BranchesSection />
          </CardContent>
        </Card>
      )}

      {/* Users */}
      {activeSection === 'Users' && <UserManagementPage />}
    </div>
  )
}
