import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Megaphone, Flag, Wrench } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

type Severity = 'info' | 'warning' | 'critical'

interface Announcement {
  id: string
  title: string
  body: string
  severity: Severity
  expiresAt: string
  archived: boolean
  createdAt: string
}

interface FeatureFlag {
  key: string
  label: string
  description: string
  enabled: boolean
  plans: string[]
}

interface MaintenanceWindow {
  id: string
  startsAt: string
  endsAt: string
  message: string
  active: boolean
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'New Lab Results Module', body: 'Lab technicians can now publish results directly from the platform.', severity: 'info', expiresAt: '2026-04-01', archived: false, createdAt: '2026-03-15' },
  { id: '2', title: 'Scheduled Maintenance', body: 'System will be down for 30 minutes on March 25 at 2:00 AM UTC.', severity: 'warning', expiresAt: '2026-03-25', archived: false, createdAt: '2026-03-18' },
  { id: '3', title: 'Welcome to ClinicCore v2', body: 'We have launched the new platform. Old version will be deprecated April 30.', severity: 'critical', expiresAt: '2026-04-30', archived: true, createdAt: '2026-03-01' },
]

const MOCK_FLAGS: FeatureFlag[] = [
  { key: 'lab_records', label: 'Lab Records Module', description: 'Enable lab records and result publishing', enabled: true, plans: ['Professional', 'Enterprise'] },
  { key: 'teleconsult', label: 'Teleconsult', description: 'Video consultation feature', enabled: false, plans: ['Enterprise'] },
  { key: 'billing', label: 'Billing & Invoices', description: 'Patient invoicing and payment tracking', enabled: true, plans: ['Starter', 'Professional', 'Enterprise'] },
  { key: 'offline_mode', label: 'Offline Mode', description: 'PWA offline data access', enabled: true, plans: ['Professional', 'Enterprise'] },
]

const MOCK_MAINTENANCE: MaintenanceWindow | null = {
  id: 'm1',
  startsAt: '2026-03-25 02:00',
  endsAt: '2026-03-25 02:30',
  message: 'Database migration for enhanced file encryption. The platform will be unavailable for 30 minutes.',
  active: true,
}

const SEVERITY_VARIANTS: Record<Severity, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  info: 'default',
  warning: 'secondary',
  critical: 'destructive',
}

interface AnnouncementForm {
  title: string
  body: string
  severity: Severity
  expiresAt: string
}

const emptyForm: AnnouncementForm = { title: '', body: '', severity: 'info', expiresAt: '' }

export function PlatformUpdatesPage() {
  const user = useAuthStore((s) => s.user)
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [flags, setFlags] = useState<FeatureFlag[]>(MOCK_FLAGS)
  const [maintenance, setMaintenance] = useState<MaintenanceWindow | null>(MOCK_MAINTENANCE)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<AnnouncementForm>(emptyForm)
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null)
  const [cancelMaintenanceOpen, setCancelMaintenanceOpen] = useState(false)

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const activeAnnouncements = announcements.filter(a => !a.archived)

  const handleCreateAnnouncement = () => {
    if (!form.title.trim()) return
    setAnnouncements(prev => [
      {
        id: Date.now().toString(),
        title: form.title.trim(),
        body: form.body.trim(),
        severity: form.severity,
        expiresAt: form.expiresAt,
        archived: false,
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...prev,
    ])
    setSheetOpen(false)
    setForm(emptyForm)
  }

  const handleArchive = () => {
    if (!archiveTarget) return
    setAnnouncements(prev => prev.map(a => a.id === archiveTarget ? { ...a, archived: true } : a))
    setArchiveTarget(null)
  }

  const toggleFlag = (key: string) => {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Updates</h1>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Announcements</CardTitle>
            </div>
            <Button size="sm" onClick={() => { setForm(emptyForm); setSheetOpen(true) }}>
              Create Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expires</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(a => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={SEVERITY_VARIANTS[a.severity]}>{a.severity}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.expiresAt}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.archived ? 'secondary' : 'default'}>
                      {a.archived ? 'Archived' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {!a.archived && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => setArchiveTarget(a.id)}
                      >
                        Archive
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {announcements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No announcements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Feature Flags</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {flags.map(flag => (
              <div key={flag.key} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{flag.label}</p>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                  <div className="flex gap-1 mt-1">
                    {flag.plans.map(p => (
                      <Badge key={p} variant="outline" className="text-xs py-0">{p}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={flag.enabled ? 'default' : 'outline'}
                  className="h-7 text-xs min-w-[60px]"
                  onClick={() => toggleFlag(flag.key)}
                  aria-label={`Toggle ${flag.label}`}
                >
                  {flag.enabled ? 'On' : 'Off'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Maintenance Mode</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {maintenance ? (
            <div className="space-y-3">
              <div className="bg-warning/10 border border-warning/30 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Scheduled</Badge>
                  <span className="text-xs text-muted-foreground">{maintenance.startsAt} – {maintenance.endsAt} UTC</span>
                </div>
                <p className="text-sm">{maintenance.message}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setCancelMaintenanceOpen(true)}
              >
                Cancel Maintenance Window
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">No active maintenance window scheduled.</p>
              <Button size="sm" variant="outline">Set Maintenance Window</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Announcement Sheet */}
      <Sheet open={sheetOpen} onOpenChange={open => !open && setSheetOpen(false)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Announcement</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Scheduled Maintenance"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ann-body">Message</Label>
              <textarea
                id="ann-body"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement body..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ann-severity">Severity</Label>
              <select
                id="ann-severity"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value as Severity }))}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ann-expires">Expires At</Label>
              <Input
                id="ann-expires"
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreateAnnouncement} disabled={!form.title.trim()}>Publish</Button>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={open => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from all users immediately and cannot be re-activated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel maintenance confirmation */}
      <AlertDialog open={cancelMaintenanceOpen} onOpenChange={setCancelMaintenanceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel maintenance window?</AlertDialogTitle>
            <AlertDialogDescription>
              The scheduled maintenance window will be removed and users will no longer see the notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep It</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setMaintenance(null); setCancelMaintenanceOpen(false) }}
            >
              Cancel Window
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
