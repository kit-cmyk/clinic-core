import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'

type TenantStatus = 'Active' | 'Suspended' | 'Provisioning'
type PlanName = 'Starter' | 'Professional' | 'Enterprise'

interface TenantMetric {
  id: string
  orgName: string
  plan: PlanName
  status: TenantStatus
  storageUsedMB: number
  storageLimitMB: number
  lastActivityAt: string
  mrr: number
}

interface MonthlyRevenue {
  month: string
  mrr: number
}

const MOCK_TENANTS: TenantMetric[] = [
  { id: '1', orgName: 'City Medical Clinic', plan: 'Professional', status: 'Active', storageUsedMB: 22528, storageLimitMB: 51200, lastActivityAt: '2 hours ago', mrr: 149 },
  { id: '2', orgName: 'Green Valley Health', plan: 'Starter', status: 'Active', storageUsedMB: 3072, storageLimitMB: 10240, lastActivityAt: '1 day ago', mrr: 49 },
  { id: '3', orgName: 'Apex Diagnostics', plan: 'Enterprise', status: 'Suspended', storageUsedMB: 122880, storageLimitMB: 204800, lastActivityAt: '5 days ago', mrr: 0 },
  { id: '4', orgName: 'Northside Family Clinic', plan: 'Professional', status: 'Provisioning', storageUsedMB: 0, storageLimitMB: 51200, lastActivityAt: 'Never', mrr: 149 },
]

const MOCK_REVENUE: MonthlyRevenue[] = [
  { month: 'Oct', mrr: 247 },
  { month: 'Nov', mrr: 347 },
  { month: 'Dec', mrr: 347 },
  { month: 'Jan', mrr: 496 },
  { month: 'Feb', mrr: 496 },
  { month: 'Mar', mrr: 347 },
]

const PLAN_COLORS: Record<PlanName, string> = {
  Starter: 'text-blue-600',
  Professional: 'text-purple-600',
  Enterprise: 'text-orange-600',
}

const STATUS_VARIANTS: Record<TenantStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Active: 'default',
  Suspended: 'destructive',
  Provisioning: 'outline',
}

function mbToGb(mb: number) {
  return (mb / 1024).toFixed(1)
}

export function MonitoringPage() {
  const user = useAuthStore((s) => s.user)
  const [sortBy, setSortBy] = useState<'storage' | 'activity' | 'plan'>('storage')

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const activeTenants = MOCK_TENANTS.filter(t => t.status === 'Active').length
  const totalMrr = MOCK_TENANTS.reduce((sum, t) => sum + t.mrr, 0)
  const totalStorageMB = MOCK_TENANTS.reduce((sum, t) => sum + t.storageUsedMB, 0)
  const planBreakdown = MOCK_TENANTS.reduce<Record<PlanName, number>>((acc, t) => {
    acc[t.plan] = (acc[t.plan] || 0) + 1
    return acc
  }, {} as Record<PlanName, number>)

  const sorted = [...MOCK_TENANTS].sort((a, b) => {
    if (sortBy === 'storage') return b.storageUsedMB - a.storageUsedMB
    if (sortBy === 'plan') return a.plan.localeCompare(b.plan)
    return 0
  })

  const maxMrr = Math.max(...MOCK_REVENUE.map(r => r.mrr))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Tenants</p>
            <p className="text-3xl font-bold mt-1">{activeTenants}</p>
            <p className="text-xs text-muted-foreground mt-1">{MOCK_TENANTS.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-3xl font-bold mt-1">${totalMrr}</p>
            <p className="text-xs text-muted-foreground mt-1">MRR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <p className="text-3xl font-bold mt-1">{mbToGb(totalStorageMB)} GB</p>
            <p className="text-xs text-muted-foreground mt-1">across all tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Plans Breakdown</p>
            <div className="mt-2 space-y-1">
              {(Object.entries(planBreakdown) as [PlanName, number][]).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between text-xs">
                  <span className={PLAN_COLORS[plan]}>{plan}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Recurring Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-32">
            {MOCK_REVENUE.map(({ month, mrr }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">${mrr}</span>
                <div
                  className="w-full bg-primary rounded-t-sm"
                  style={{ height: `${(mrr / maxMrr) * 80}px` }}
                />
                <span className="text-xs text-muted-foreground">{month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Health Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tenant Health</CardTitle>
            <div className="flex gap-2">
              {(['storage', 'activity', 'plan'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={sortBy === s ? 'default' : 'outline'}
                  onClick={() => setSortBy(s)}
                  className="text-xs h-7"
                >
                  Sort: {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organization</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Storage</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Activity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(tenant => {
                const storagePct = Math.min((tenant.storageUsedMB / tenant.storageLimitMB) * 100, 100)
                return (
                  <tr key={tenant.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{tenant.orgName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${PLAN_COLORS[tenant.plan]}`}>{tenant.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${storagePct > 80 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${storagePct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {mbToGb(tenant.storageUsedMB)}/{mbToGb(tenant.storageLimitMB)} GB
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tenant.lastActivityAt}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[tenant.status]}>{tenant.status}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
