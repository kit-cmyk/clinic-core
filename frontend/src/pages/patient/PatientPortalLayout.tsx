import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

const NAV_LINKS = [
  { to: '/portal', label: 'Dashboard', end: true },
  { to: '/portal/appointments', label: 'Appointments', end: false },
  { to: '/portal/results', label: 'Results', end: false },
  { to: '/portal/prescriptions', label: 'Prescriptions', end: false },
  { to: '/portal/upload', label: 'Upload', end: false },
]

export function PatientPortalLayout() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-foreground">ClinicCore Patient Portal</span>
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
        </div>
      </header>
      <nav className="border-b bg-card px-4">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
