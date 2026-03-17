import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'org_admin', 'branch_manager', 'doctor', 'nurse', 'receptionist', 'lab_technician'],
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
    label: 'Organizations',
    to: '/organizations',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    roles: ['super_admin', 'org_admin', 'branch_manager'],
  },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">ClinicCore</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden h-7 w-7 text-sidebar-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User */}
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
      </aside>
    </>
  )
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
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
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
