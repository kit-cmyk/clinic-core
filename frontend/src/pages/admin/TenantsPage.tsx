import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth'
import {
  Search,
  Building2,
  Users,
  HardDrive,
  CreditCard,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Send,
  Bell,
  UserX,
  UserCheck,
  Receipt,
  Plus,
  MoreHorizontal,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type PlanKey = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
type TenantStatus = 'Active' | 'Suspended'
type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
type StaffRole = 'ORG_ADMIN' | 'DOCTOR' | 'NURSE' | 'SECRETARY' | 'PATIENT'

interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  isActive: boolean
  lastLogin: string | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  description: string
  amountCents: number
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  paidAt: string | null
}

interface ReminderLog {
  id: string
  sentAt: string
  invoiceNumber: string
  recipient: string
}

interface TenantDetail {
  id: string
  name: string
  slug: string
  plan: PlanKey
  status: TenantStatus
  contactEmail: string
  contactPhone: string
  branchCount: number
  storageLimitGb: number
  storageUsedGb: number
  joinedAt: string
  staff: StaffMember[]
  invoices: Invoice[]
  reminderLog: ReminderLog[]
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_TENANTS: TenantDetail[] = [
  {
    id: '1',
    name: 'City Medical Clinic',
    slug: 'city-medical',
    plan: 'PRO',
    status: 'Active',
    contactEmail: 'admin@citymedical.com',
    contactPhone: '+1 (555) 100-2000',
    branchCount: 3,
    storageLimitGb: 50,
    storageUsedGb: 22,
    joinedAt: '2025-11-12',
    staff: [
      { id: 's1', name: 'Dr. Maria Santos', email: 'maria@citymedical.com', role: 'DOCTOR', isActive: true, lastLogin: '2026-03-20' },
      { id: 's2', name: 'James Reyes', email: 'james@citymedical.com', role: 'ORG_ADMIN', isActive: true, lastLogin: '2026-03-21' },
      { id: 's3', name: 'Anna Cruz', email: 'anna@citymedical.com', role: 'NURSE', isActive: true, lastLogin: '2026-03-19' },
      { id: 's4', name: 'Carlos Tan', email: 'carlos@citymedical.com', role: 'SECRETARY', isActive: false, lastLogin: '2026-02-28' },
    ],
    invoices: [
      { id: 'i1', invoiceNumber: 'INV-2026-003', description: 'Pro Plan — April 2026', amountCents: 14900, status: 'SENT', issuedAt: '2026-03-01', dueAt: '2026-04-01', paidAt: null },
      { id: 'i2', invoiceNumber: 'INV-2026-002', description: 'Pro Plan — March 2026', amountCents: 14900, status: 'PAID', issuedAt: '2026-02-01', dueAt: '2026-03-01', paidAt: '2026-03-01' },
      { id: 'i3', invoiceNumber: 'INV-2026-001', description: 'Pro Plan — February 2026', amountCents: 14900, status: 'PAID', issuedAt: '2026-01-01', dueAt: '2026-02-01', paidAt: '2026-02-01' },
    ],
    reminderLog: [
      { id: 'r1', sentAt: '2026-03-10T09:00:00Z', invoiceNumber: 'INV-2026-003', recipient: 'admin@citymedical.com' },
    ],
  },
  {
    id: '2',
    name: 'Green Valley Health',
    slug: 'green-valley',
    plan: 'BASIC',
    status: 'Active',
    contactEmail: 'admin@greenvalley.com',
    contactPhone: '+1 (555) 200-3000',
    branchCount: 1,
    storageLimitGb: 10,
    storageUsedGb: 3,
    joinedAt: '2026-01-05',
    staff: [
      { id: 's5', name: 'Dr. Leo Bautista', email: 'leo@greenvalley.com', role: 'DOCTOR', isActive: true, lastLogin: '2026-03-17' },
      { id: 's6', name: 'Rita Ong', email: 'rita@greenvalley.com', role: 'ORG_ADMIN', isActive: true, lastLogin: '2026-03-17' },
    ],
    invoices: [
      { id: 'i4', invoiceNumber: 'INV-2026-006', description: 'Basic Plan — April 2026', amountCents: 4900, status: 'OVERDUE', issuedAt: '2026-02-28', dueAt: '2026-03-15', paidAt: null },
      { id: 'i5', invoiceNumber: 'INV-2026-005', description: 'Basic Plan — March 2026', amountCents: 4900, status: 'PAID', issuedAt: '2026-01-31', dueAt: '2026-02-28', paidAt: '2026-02-25' },
    ],
    reminderLog: [],
  },
  {
    id: '3',
    name: 'Apex Diagnostics',
    slug: 'apex-diagnostics',
    plan: 'ENTERPRISE',
    status: 'Suspended',
    contactEmail: 'billing@apexdiag.com',
    contactPhone: '+1 (555) 300-4000',
    branchCount: 8,
    storageLimitGb: 200,
    storageUsedGb: 120,
    joinedAt: '2025-08-20',
    staff: [
      { id: 's7', name: 'Dr. Patricia Lim', email: 'patricia@apexdiag.com', role: 'DOCTOR', isActive: false, lastLogin: '2026-03-13' },
      { id: 's8', name: 'Victor Wong', email: 'victor@apexdiag.com', role: 'ORG_ADMIN', isActive: false, lastLogin: '2026-03-13' },
    ],
    invoices: [
      { id: 'i6', invoiceNumber: 'INV-2026-008', description: 'Enterprise Plan — March 2026', amountCents: 59900, status: 'OVERDUE', issuedAt: '2026-02-01', dueAt: '2026-03-01', paidAt: null },
      { id: 'i7', invoiceNumber: 'INV-2026-007', description: 'Enterprise Plan — February 2026', amountCents: 59900, status: 'OVERDUE', issuedAt: '2026-01-01', dueAt: '2026-02-01', paidAt: null },
    ],
    reminderLog: [
      { id: 'r2', sentAt: '2026-03-05T08:30:00Z', invoiceNumber: 'INV-2026-008', recipient: 'billing@apexdiag.com' },
      { id: 'r3', sentAt: '2026-02-10T08:30:00Z', invoiceNumber: 'INV-2026-007', recipient: 'billing@apexdiag.com' },
    ],
  },
  {
    id: '4',
    name: 'Sunrise Wellness',
    slug: 'sunrise-wellness',
    plan: 'FREE',
    status: 'Suspended',
    contactEmail: 'contact@sunrisewellness.com',
    contactPhone: '+1 (555) 400-5000',
    branchCount: 1,
    storageLimitGb: 5,
    storageUsedGb: 1,
    joinedAt: '2026-02-14',
    staff: [
      { id: 's9', name: 'Dr. Grace Dela Cruz', email: 'grace@sunrisewellness.com', role: 'DOCTOR', isActive: false, lastLogin: '2026-03-08' },
    ],
    invoices: [],
    reminderLog: [],
  },
]

// ── Config ─────────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<PlanKey, { label: string; color: string }> = {
  FREE:       { label: 'Free',       color: 'text-slate-600'  },
  BASIC:      { label: 'Basic',      color: 'text-blue-600'   },
  PRO:        { label: 'Pro',        color: 'text-purple-600' },
  ENTERPRISE: { label: 'Enterprise', color: 'text-amber-600'  },
}

const ROLE_LABELS: Record<StaffRole, string> = {
  ORG_ADMIN: 'Org Admin',
  DOCTOR:    'Doctor',
  NURSE:     'Nurse',
  SECRETARY: 'Secretary',
  PATIENT:   'Patient',
}

const INVOICE_CONFIG: Record<InvoiceStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ReactNode
}> = {
  DRAFT:   { label: 'Draft',   variant: 'outline',     icon: <Clock className="h-3 w-3" />          },
  SENT:    { label: 'Sent',    variant: 'secondary',   icon: <Send className="h-3 w-3" />           },
  PAID:    { label: 'Paid',    variant: 'default',     icon: <CheckCircle2 className="h-3 w-3" />   },
  OVERDUE: { label: 'Overdue', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OverviewTab({ tenant }: { tenant: TenantDetail }) {
  const storagePct = Math.min(Math.round((tenant.storageUsedGb / tenant.storageLimitGb) * 100), 100)
  const planCfg = PLAN_CONFIG[tenant.plan]

  return (
    <div className="space-y-5">
      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Contact Email</p>
          <a href={`mailto:${tenant.contactEmail}`} className="text-sm font-medium text-primary hover:underline">
            {tenant.contactEmail}
          </a>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="text-sm font-medium">{tenant.contactPhone}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className={`text-sm font-semibold ${planCfg.color}`}>{planCfg.label}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant={tenant.status === 'Active' ? 'default' : 'destructive'}>
            {tenant.status}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Branches</p>
          <p className="text-sm font-medium">{tenant.branchCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Joined</p>
          <p className="text-sm font-medium">{formatDate(tenant.joinedAt)}</p>
        </div>
      </div>

      {/* Storage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-medium">{tenant.storageUsedGb} / {tenant.storageLimitGb} GB ({storagePct}%)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${storagePct > 80 ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${storagePct}%` }}
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            Change Plan
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`gap-1.5 text-xs ${tenant.status === 'Active' ? 'text-destructive hover:text-destructive' : ''}`}
          >
            {tenant.status === 'Active'
              ? <><XCircle className="h-3.5 w-3.5" /> Suspend Tenant</>
              : <><UserCheck className="h-3.5 w-3.5" /> Reactivate Tenant</>
            }
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5" />
            Email Admin
          </Button>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ tenant }: { tenant: TenantDetail }) {
  const activeCount = tenant.staff.filter(s => s.isActive).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeCount} active · {tenant.staff.length - activeCount} inactive
        </p>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Mail className="h-3.5 w-3.5" />
          Invite User
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border overflow-hidden">
        {tenant.staff.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No staff members.</p>
        )}
        {tenant.staff.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-4 py-3 bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {member.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  {!member.isActive && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium">{ROLE_LABELS[member.role]}</p>
                <p className="text-[10px] text-muted-foreground">
                  {member.lastLogin ? `Last login ${formatDate(member.lastLogin)}` : 'Never logged in'}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Row actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5" />
                    Send Password Reset
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className={`gap-2 text-xs ${member.isActive ? 'text-destructive focus:text-destructive' : 'text-emerald-600 focus:text-emerald-600'}`}>
                    {member.isActive
                      ? <><UserX className="h-3.5 w-3.5" />Deactivate</>
                      : <><UserCheck className="h-3.5 w-3.5" />Reactivate</>
                    }
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BillingTab({ tenant }: { tenant: TenantDetail }) {
  const planCfg = PLAN_CONFIG[tenant.plan]
  const overdueInvoices = tenant.invoices.filter(i => i.status === 'OVERDUE')
  const totalOwed = overdueInvoices.reduce((s, i) => s + i.amountCents, 0)

  return (
    <div className="space-y-5">
      {/* Overdue alert */}
      {overdueInvoices.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">
              {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} — {formatCents(totalOwed)} outstanding
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Send a billing reminder to notify the account admin.</p>
          </div>
        </div>
      )}

      {/* Subscription summary */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Current Plan</p>
          <p className={`text-sm font-semibold mt-0.5 ${planCfg.color}`}>{planCfg.label}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <CreditCard className="h-3.5 w-3.5" />
          Change Plan
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="default" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New Invoice
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled={overdueInvoices.length === 0}>
          <Bell className="h-3.5 w-3.5" />
          Send Billing Reminder
        </Button>
      </div>

      {/* Invoice list */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoices</p>
        {tenant.invoices.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No invoices yet.</p>
        )}
        <div className="divide-y divide-border rounded-lg border overflow-hidden">
          {tenant.invoices.map((inv) => {
            const cfg = INVOICE_CONFIG[inv.status]
            return (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <Badge variant={cfg.variant} className="gap-1 text-[10px] h-4 px-1.5">
                        {cfg.icon}{cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{inv.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold">{formatCents(inv.amountCents)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {inv.status === 'PAID' && inv.paidAt
                      ? `Paid ${formatDate(inv.paidAt)}`
                      : `Due ${formatDate(inv.dueAt)}`}
                  </p>
                </div>
                <div className="flex gap-1 ml-3">
                  {inv.status !== 'PAID' && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Send invoice">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reminder log */}
      {tenant.reminderLog.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reminder History</p>
          <div className="space-y-1.5">
            {tenant.reminderLog.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="h-3 w-3 shrink-0" />
                <span>Reminder sent for <span className="font-medium text-foreground">{r.invoiceNumber}</span> to {r.recipient}</span>
                <span className="ml-auto shrink-0">{formatDateTime(r.sentAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────

function TenantDetailPanel({ tenant }: { tenant: TenantDetail }) {
  const overdueCount = tenant.invoices.filter(i => i.status === 'OVERDUE').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold leading-tight">{tenant.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{tenant.slug}</p>
          </div>
          <Badge variant={tenant.status === 'Active' ? 'default' : 'destructive'}>
            {tenant.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="overview" className="h-full">
          <div className="px-5 pt-3 border-b sticky top-0 bg-background z-10">
            <TabsList className="h-8">
              <TabsTrigger value="overview" className="text-xs px-3 h-7">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs px-3 h-7">
                Users & Staff
                <span className="ml-1.5 text-[10px] bg-muted rounded px-1">{tenant.staff.length}</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="text-xs px-3 h-7 relative">
                Billing
                {overdueCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-destructive text-destructive-foreground rounded px-1">
                    {overdueCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-5 py-4">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab tenant={tenant} />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <UsersTab tenant={tenant} />
            </TabsContent>
            <TabsContent value="billing" className="mt-0">
              <BillingTab tenant={tenant} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TenantsPage() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | TenantStatus>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const filtered = MOCK_TENANTS.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedTenant = MOCK_TENANTS.find((t) => t.id === selectedId) ?? null

  const overdueMap = Object.fromEntries(
    MOCK_TENANTS.map((t) => [t.id, t.invoices.filter(i => i.status === 'OVERDUE').length])
  )

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-0 -m-6 overflow-hidden">

      {/* ── Left: Tenant list ── */}
      <div className="w-80 shrink-0 flex flex-col border-r bg-background">
        {/* Search + filter */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {(['All', 'Active', 'Suspended'] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
                className="h-6 text-xs px-2.5 flex-1"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No tenants found.</p>
          )}
          {filtered.map((tenant) => {
            const planCfg = PLAN_CONFIG[tenant.plan]
            const overdue = overdueMap[tenant.id] ?? 0
            const isSelected = tenant.id === selectedId

            return (
              <button
                key={tenant.id}
                onClick={() => setSelectedId(tenant.id)}
                className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-muted/50 ${
                  isSelected ? 'bg-muted border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{tenant.contactEmail}</p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[11px] font-semibold ${planCfg.color}`}>{planCfg.label}</span>
                  <span className="text-muted-foreground text-[10px]">·</span>
                  <Badge
                    variant={tenant.status === 'Active' ? 'default' : 'destructive'}
                    className="text-[10px] h-4 px-1.5"
                  >
                    {tenant.status}
                  </Badge>
                  {overdue > 0 && (
                    <>
                      <span className="text-muted-foreground text-[10px]">·</span>
                      <span className="text-[10px] font-semibold text-destructive flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />{overdue} overdue
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{tenant.branchCount}</span>
                  <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{tenant.staff.length}</span>
                  <span className="flex items-center gap-1"><HardDrive className="h-2.5 w-2.5" />{tenant.storageUsedGb}/{tenant.storageLimitGb} GB</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer count */}
        <div className="px-4 py-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">{filtered.length} of {MOCK_TENANTS.length} tenants</p>
        </div>
      </div>

      {/* ── Right: Detail panel ── */}
      <div className="flex-1 overflow-hidden bg-background">
        {selectedTenant ? (
          <TenantDetailPanel key={selectedTenant.id} tenant={selectedTenant} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">Select a tenant to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
