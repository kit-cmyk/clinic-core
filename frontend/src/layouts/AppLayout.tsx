import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FlaskConical,
  Receipt,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Clock,
  Activity,
  UserPlus,
  CreditCard,
  Database,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingChecklist } from '@/components/OnboardingChecklist'
import type { Role } from '@/types'

// ── Breadcrumbs ────────────────────────────────────────────────────────────────

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard:      'Dashboard',
  appointments:   'Appointments',
  visit:          'Visit',
  patients:       'Patients',
  chart:          'Chart',
  professionals:  'Professionals',
  'clinic-hours': 'Clinic Hours',
  lab:            'Lab Records',
  publish:        'Publish Result',
  billing:        'Billing',
  organizations:  'Organizations',
  settings:       'Settings',
  admin:          'Admin',
  plans:          'Plans',
  tenants:        'Tenants',
  'master-data':  'Master Data',
  'sign-ups':     'Sign-Ups',
  provisioning:   'Provisioning',
  monitoring:     'Monitoring',
  updates:        'Platform Updates',
  onboarding:     'Onboarding',
  branches:       'Branches',
  staff:          'Staff',
  'review-queue': 'Review Queue',
  'check-in':     'Check-In',
}

// Paths that have actual routes (safe to render as links)
const ROUTED_PATHS = new Set([
  '/dashboard', '/appointments', '/patients', '/professionals',
  '/clinic-hours', '/lab', '/billing', '/organizations', '/settings',
  '/admin/plans', '/admin/tenants', '/admin/master-data', '/admin/sign-ups', '/admin/monitoring', '/admin/updates', '/onboarding', '/branches', '/staff',
  '/lab/publish', '/review-queue', '/check-in',
])

function Breadcrumbs() {
  const location = useLocation()
  const crumbs: { label: string; to: string }[] = []
  let path = ''

  for (const seg of location.pathname.split('/').filter(Boolean)) {
    path += `/${seg}`
    const label = BREADCRUMB_LABELS[seg]
    if (label) crumbs.push({ label, to: path })
  }

  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 px-6 py-2 text-xs border-b border-border bg-background shrink-0"
    >
      {crumbs.map((crumb, i) => (
        <span key={crumb.to} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
          {i === crumbs.length - 1 || !ROUTED_PATHS.has(crumb.to) ? (
            <span className={cn(
              i === crumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.to}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  roles: Role[]
  dividerBefore?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    roles: ['org_admin', 'branch_manager', 'doctor', 'nurse', 'receptionist', 'lab_technician'],
  },
  {
    label: 'Appointments',
    to: '/appointments',
    icon: CalendarDays,
    roles: ['org_admin', 'branch_manager', 'doctor', 'nurse', 'receptionist'],
  },
  {
    label: 'Patients',
    to: '/patients',
    icon: Users,
    roles: ['org_admin', 'branch_manager', 'doctor', 'nurse', 'receptionist'],
  },
  {
    label: 'Professionals',
    to: '/professionals',
    icon: Stethoscope,
    roles: ['org_admin', 'branch_manager'],
  },
  {
    label: 'Clinic Hours',
    to: '/clinic-hours',
    icon: Clock,
    roles: ['org_admin', 'branch_manager'],
  },
  {
    label: 'Lab Records',
    to: '/lab',
    icon: FlaskConical,
    roles: ['org_admin', 'branch_manager', 'doctor', 'nurse', 'lab_technician'],
  },
  {
    label: 'Billing',
    to: '/billing',
    icon: Receipt,
    roles: ['org_admin', 'branch_manager', 'receptionist'],
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    roles: ['org_admin', 'branch_manager'],
  },
  // ── Super Admin section ──────────────────────────────────────────────────────
  {
    label: 'Platform Overview',
    to: '/admin/monitoring',
    icon: Activity,
    roles: ['super_admin'],
    dividerBefore: true,
  },
  {
    label: 'Tenants',
    to: '/admin/tenants',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    label: 'Sign-Ups',
    to: '/admin/sign-ups',
    icon: UserPlus,
    roles: ['super_admin'],
  },
  {
    label: 'Plans',
    to: '/admin/plans',
    icon: CreditCard,
    roles: ['super_admin'],
  },
  {
    label: 'Master Data',
    to: '/admin/master-data',
    icon: Database,
    roles: ['super_admin'],
  },
  {
    label: 'Platform Updates',
    to: '/admin/updates',
    icon: Megaphone,
    roles: ['super_admin'],
  },
]

function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  open: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleItems = user
    ? NAV_ITEMS.filter((item) => item.roles.includes(user.role))
    : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-14' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-3 border-b border-sidebar-border shrink-0">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm">C</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground truncate">ClinicCore</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden h-7 w-7 text-sidebar-foreground shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleItems.map((item) => (
            <div key={item.to}>
              {item.dividerBefore && (
                <div className="pt-2 pb-1">
                  <Separator className="bg-sidebar-border" />
                  {!collapsed && (
                    <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Admin
                    </p>
                  )}
                </div>
              )}
              <NavLink
                to={item.to}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center' : 'px-3',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </NavLink>
            </div>
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User */}
        {!collapsed && (
          <div className="p-3">
            <div className="flex items-center gap-3 rounded-md px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-xs font-medium">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive mt-1 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        )}

        {/* Collapsed user avatar */}
        {collapsed && (
          <div className="p-2 flex flex-col items-center gap-2">
            <div
              className="h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer"
              title={user?.name}
            >
              <span className="text-primary-foreground text-xs font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex justify-center p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </>
  )
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
  })
  const { isOnline } = useNetworkStatus()
  const sync = useSyncStatus()

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* noop */ }
      return next
    })
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Offline banner */}
        {!isOnline && (
          <div
            role="alert"
            className="flex items-center justify-center gap-2 bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-sm text-destructive"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
            You are offline — changes will sync when reconnected
          </div>
        )}

        {/* Topbar — mobile only */}
        <header className="flex h-14 items-center border-b border-border px-4 lg:hidden bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="ml-3 font-semibold text-foreground">ClinicCore</span>
          <div className="ml-auto">
            <SyncStatusBadge sync={sync} />
          </div>
        </header>

        {/* Desktop header row for sync badge */}
        <div className="hidden lg:flex h-10 items-center justify-end border-b border-border px-6 bg-background">
          <SyncStatusBadge sync={sync} />
        </div>

        <Breadcrumbs />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <OnboardingChecklist />
    </div>
  )
}
