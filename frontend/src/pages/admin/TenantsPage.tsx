import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

type TenantStatus = 'Active' | 'Suspended'
type TenantPlan = 'Starter' | 'Professional' | 'Enterprise'

interface Tenant {
  id: string
  name: string
  plan: TenantPlan
  status: TenantStatus
  branchCount: number
  staffCount: number
  lastActivity: string
  contactEmail: string
  storageUsed: number
  storageLimit: number
  activeUsers: number
  lastLogin: string
}

const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'City Medical Clinic', plan: 'Professional', status: 'Active', branchCount: 3, staffCount: 18, lastActivity: '2 hours ago', contactEmail: 'admin@citymedical.com', storageUsed: 22, storageLimit: 50, activeUsers: 15, lastLogin: '2026-03-18' },
  { id: '2', name: 'Green Valley Health', plan: 'Starter', status: 'Active', branchCount: 1, staffCount: 4, lastActivity: '1 day ago', contactEmail: 'admin@greenvalley.com', storageUsed: 3, storageLimit: 10, activeUsers: 4, lastLogin: '2026-03-17' },
  { id: '3', name: 'Apex Diagnostics', plan: 'Enterprise', status: 'Suspended', branchCount: 8, staffCount: 45, lastActivity: '5 days ago', contactEmail: 'billing@apexdiag.com', storageUsed: 120, storageLimit: 200, activeUsers: 0, lastLogin: '2026-03-13' },
  { id: '4', name: 'Sunrise Wellness', plan: 'Starter', status: 'Suspended', branchCount: 1, staffCount: 2, lastActivity: '10 days ago', contactEmail: 'contact@sunrisewellness.com', storageUsed: 1, storageLimit: 10, activeUsers: 0, lastLogin: '2026-03-08' },
]

const PLANS: TenantPlan[] = ['Starter', 'Professional', 'Enterprise']

export function TenantsPage() {
  const user = useAuthStore((s) => s.user)
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS)
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

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const toggleSuspend = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' } : t))
  }

  const changePlan = (id: string, plan: TenantPlan) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, plan } : t))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Tenant Management</h1>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search tenants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          {(['All', 'Active', 'Suspended'] as const).map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Tenant list */}
      <div className="space-y-3">
        {filtered.map(tenant => (
          <Card
            key={tenant.id}
            className="cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => setSelectedId(selectedId === tenant.id ? null : tenant.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-foreground">{tenant.name}</p>
                  <Badge variant="outline">{tenant.plan}</Badge>
                  <Badge variant={tenant.status === 'Active' ? 'default' : 'destructive'}>{tenant.status}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{tenant.branchCount} branches</span>
                    <span>{tenant.staffCount} staff</span>
                    <span>Active {tenant.lastActivity}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={e => { e.stopPropagation(); setSelectedId(selectedId === tenant.id ? null : tenant.id) }}
                      >
                        {selectedId === tenant.id ? 'Collapse' : 'View Details'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={tenant.status === 'Active' ? 'text-destructive focus:text-destructive' : ''}
                        onClick={e => { e.stopPropagation(); toggleSuspend(tenant.id) }}
                      >
                        {tenant.status === 'Active' ? 'Suspend' : 'Reactivate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Detail panel */}
              {selectedId === tenant.id && (
                <div className="mt-4 border-t pt-4 space-y-4" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Contact Email</p>
                      <p className="font-medium">{tenant.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active Users</p>
                      <p className="font-medium">{tenant.activeUsers}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Login</p>
                      <p className="font-medium">{tenant.lastLogin}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Storage Used</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min((tenant.storageUsed / tenant.storageLimit) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs whitespace-nowrap">{tenant.storageUsed}/{tenant.storageLimit} GB</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mr-2">Change Plan:</label>
                    <select
                      className="border rounded-md px-2 py-1 text-sm bg-background"
                      value={tenant.plan}
                      onChange={e => changePlan(tenant.id, e.target.value as TenantPlan)}
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No tenants found.</p>
        )}
      </div>
    </div>
  )
}
