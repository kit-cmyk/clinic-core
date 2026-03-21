import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'
import {
  RefreshCw,
  Building2,
  DollarSign,
  HardDrive,
  ClipboardList,
  AlertTriangle,
  Info,
  XCircle,
  Wrench,
  TrendingUp,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type PlanKey = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
type SeverityKey = 'INFO' | 'WARNING' | 'CRITICAL'
type SortKey = 'plan' | 'storage' | 'joined'

interface TenantRow {
  id: string
  name: string
  plan: PlanKey
  isActive: boolean
  storageLimitBytes: string
  createdAt: string
}

interface MetricsPayload {
  activeTenants: number
  totalTenants: number
  mrrUsd: number
  storageSumBytes: string
  planBreakdown: Partial<Record<PlanKey, number>>
  tenants: TenantRow[]
  cached: boolean
  generatedAt: string
}

interface Announcement {
  id: string
  title: string
  body: string
  severity: SeverityKey
  isArchived: boolean
  publishedAt: string
}

interface MaintenanceWindow {
  id: string
  title: string
  startsAt: string
  endsAt: string
  isCancelled: boolean
}

// ── Config ─────────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<PlanKey, { label: string; textColor: string; barColor: string }> = {
  FREE:       { label: 'Free',       textColor: 'text-slate-600',  barColor: 'bg-slate-400'  },
  BASIC:      { label: 'Basic',      textColor: 'text-blue-600',   barColor: 'bg-blue-500'   },
  PRO:        { label: 'Pro',        textColor: 'text-purple-600', barColor: 'bg-purple-500' },
  ENTERPRISE: { label: 'Enterprise', textColor: 'text-amber-600',  barColor: 'bg-amber-500'  },
}

const SEVERITY_CONFIG: Record<SeverityKey, {
  icon: React.ReactNode
  border: string
  bg: string
  badge: 'default' | 'secondary' | 'destructive' | 'outline'
}> = {
  INFO:     { icon: <Info className="h-4 w-4 text-blue-500" />,     border: 'border-blue-200',  bg: 'bg-blue-50',   badge: 'secondary'    },
  WARNING:  { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, border: 'border-amber-200', bg: 'bg-amber-50',  badge: 'outline'      },
  CRITICAL: { icon: <XCircle className="h-4 w-4 text-red-500" />,   border: 'border-red-200',   bg: 'bg-red-50',    badge: 'destructive'  },
}

const PLAN_ORDER: PlanKey[] = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']

// ── Helpers ────────────────────────────────────────────────────────────────────

function bytesToGb(bytes: string | number): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (isNaN(b)) return '0.0'
  return (b / 1024 ** 3).toFixed(1)
}

function formatMrr(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getLastNMonthKeys(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (n - 1 - i))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' })
}

function tenantCountByMonth(tenants: TenantRow[], monthKeys: string[]): number[] {
  return monthKeys.map((ym) =>
    tenants.filter((t) => {
      const d = new Date(t.createdAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === ym
    }).length,
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        <div className="h-2 w-20 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MonitoringPage() {
  const user = useAuthStore((s) => s.user)

  const [metrics, setMetrics] = useState<MetricsPayload | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceWindow[]>([])
  const [pendingSignUps, setPendingSignUps] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>('joined')

  const fetchAll = useCallback(async (bustCache = false) => {
    if (bustCache) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      if (bustCache) {
        await api.post('/api/v1/metrics/cache/bust')
      }

      const [metricsRes, announcementsRes, maintenanceRes, signUpsRes] = await Promise.allSettled([
        api.get<MetricsPayload>('/api/v1/metrics'),
        api.get<Announcement[]>('/api/v1/platform/announcements'),
        api.get<MaintenanceWindow[]>('/api/v1/platform/maintenance'),
        api.get<unknown[]>('/api/v1/tenant-requests?status=PENDING'),
      ])

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data)
      } else {
        throw new Error('Failed to load platform metrics')
      }

      if (announcementsRes.status === 'fulfilled') {
        const all = announcementsRes.value.data ?? []
        setAnnouncements(all.filter((a) => !a.isArchived))
      }

      if (maintenanceRes.status === 'fulfilled') {
        const now = new Date()
        setMaintenance(
          (maintenanceRes.value.data ?? []).filter(
            (m) => !m.isCancelled && new Date(m.endsAt) > now,
          ),
        )
      }

      if (signUpsRes.status === 'fulfilled') {
        setPendingSignUps((signUpsRes.value.data as unknown[]).length)
      }

      setLastRefreshed(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const monthKeys = getLastNMonthKeys(6)
  const growthCounts = metrics ? tenantCountByMonth(metrics.tenants, monthKeys) : Array(6).fill(0)
  const maxGrowth = Math.max(...growthCounts, 1)

  const totalTenantCount = metrics
    ? Object.values(metrics.planBreakdown).reduce((s, n) => s + (n ?? 0), 0)
    : 0

  const sortedTenants = metrics
    ? [...metrics.tenants].sort((a, b) => {
        if (sortBy === 'plan') return PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan)
        if (sortBy === 'storage')
          return parseInt(b.storageLimitBytes, 10) - parseInt(a.storageLimitBytes, 10)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    : []

  const hasAlerts = announcements.length > 0 || maintenance.length > 0

  // ── Error state ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => fetchAll()}>
          Retry
        </Button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last updated {formatTime(lastRefreshed)}
              {metrics?.cached && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                  cached
                </span>
              )}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Tenants</p>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{metrics?.activeTenants ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.totalTenants ?? 0} total provisioned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{formatMrr(metrics?.mrrUsd ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">MRR across active tenants</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Provisioned Storage</p>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">
                  {bytesToGb(metrics?.storageSumBytes ?? '0')} GB
                </p>
                <p className="text-xs text-muted-foreground mt-1">total allocated</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Pending Sign-ups</p>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{pendingSignUps}</p>
                <p className="text-xs text-muted-foreground mt-1">awaiting review</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Platform Alerts */}
      {!loading && hasAlerts && (
        <div className="space-y-2">
          {announcements.map((a) => {
            const cfg = SEVERITY_CONFIG[a.severity] ?? SEVERITY_CONFIG.INFO
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${cfg.border} ${cfg.bg}`}
              >
                <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <Badge variant={cfg.badge} className="text-[10px] h-4 px-1.5">
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.body}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {formatDate(a.publishedAt)}
                </span>
              </div>
            )
          })}
          {maintenance.map((m) => (
            <div
              key={m.id}
              className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
            >
              <Wrench className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{m.title}</p>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-orange-300 text-orange-700">
                    Maintenance
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(m.startsAt)} → {formatDate(m.endsAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tenant Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              New Tenants — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 flex items-end gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-muted rounded-t-sm animate-pulse"
                      style={{ height: `${Math.random() * 60 + 20}px` }}
                    />
                    <div className="h-2 w-6 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-3 h-32">
                {monthKeys.map((mk, i) => {
                  const count = growthCounts[i]
                  const heightPx = count === 0 ? 4 : Math.max((count / maxGrowth) * 88, 4)
                  return (
                    <div key={mk} className="flex-1 flex flex-col items-center gap-1">
                      {count > 0 && (
                        <span className="text-xs font-medium text-muted-foreground">{count}</span>
                      )}
                      <div className="w-full flex items-end" style={{ height: '88px' }}>
                        <div
                          className={`w-full rounded-t-sm transition-all ${count === 0 ? 'bg-muted' : 'bg-primary'}`}
                          style={{ height: `${heightPx}px` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{monthLabel(mk)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-6 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
                </div>
              ))
            ) : (
              PLAN_ORDER.map((plan) => {
                const count = metrics?.planBreakdown[plan] ?? 0
                const pct = totalTenantCount > 0 ? Math.round((count / totalTenantCount) * 100) : 0
                const cfg = PLAN_CONFIG[plan]
                return (
                  <div key={plan} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${cfg.textColor}`}>{cfg.label}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cfg.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Health Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tenant Health</CardTitle>
            <div className="flex gap-2">
              {(['joined', 'plan', 'storage'] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={sortBy === s ? 'default' : 'outline'}
                  onClick={() => setSortBy(s)}
                  className="text-xs h-7 capitalize"
                >
                  {s === 'joined' ? 'Newest First' : s === 'plan' ? 'Plan' : 'Storage'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : sortedTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No tenants provisioned yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organization</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Storage Limit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {sortedTenants.map((tenant) => {
                  const planCfg = PLAN_CONFIG[tenant.plan] ?? PLAN_CONFIG.FREE
                  return (
                    <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{tenant.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${planCfg.textColor}`}>
                          {planCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {bytesToGb(tenant.storageLimitBytes)} GB
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tenant.isActive ? 'default' : 'destructive'}>
                          {tenant.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(tenant.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
