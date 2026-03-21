import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useAuthStore } from '@/store/auth'

type SignUpStatus = 'pending' | 'approved' | 'rejected'
type PlanName = 'Starter' | 'Professional' | 'Enterprise'

interface TenantRequest {
  id: string
  orgName: string
  contactEmail: string
  contactName: string
  plan: PlanName
  notes: string
  status: SignUpStatus
  rejectionReason: string
  requestedAt: string
}

const MOCK_REQUESTS: TenantRequest[] = [
  {
    id: '1',
    orgName: 'Northside Family Clinic',
    contactEmail: 'dr.santos@northside.com',
    contactName: 'Dr. Maria Santos',
    plan: 'Professional',
    notes: 'Multi-branch family clinic with 3 locations. Need staff invites for 20 users.',
    status: 'pending',
    rejectionReason: '',
    requestedAt: '2026-03-19',
  },
  {
    id: '2',
    orgName: 'BrightLife Diagnostics',
    contactEmail: 'admin@brightlife.com',
    contactName: 'James Reyes',
    plan: 'Enterprise',
    notes: 'Lab-focused group with 8 branches. Requires high storage and lab records module.',
    status: 'pending',
    rejectionReason: '',
    requestedAt: '2026-03-18',
  },
  {
    id: '3',
    orgName: 'Sunrise Wellness Center',
    contactEmail: 'hello@sunrisewellness.ph',
    contactName: 'Ana Lim',
    plan: 'Starter',
    notes: 'Single-branch wellness clinic. Solo practitioner.',
    status: 'approved',
    rejectionReason: '',
    requestedAt: '2026-03-15',
  },
  {
    id: '4',
    orgName: 'MedFast Urgent Care',
    contactEmail: 'ops@medfast.com',
    contactName: 'Rico Tan',
    plan: 'Starter',
    notes: 'Urgent care chain. Could not verify business registration.',
    status: 'rejected',
    rejectionReason: 'Unable to verify business registration documents.',
    requestedAt: '2026-03-12',
  },
]

const STATUS_VARIANTS: Record<SignUpStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
}

type FilterStatus = 'All' | SignUpStatus

export function SignUpsPage() {
  const user = useAuthStore((s) => s.user)
  const [requests, setRequests] = useState<TenantRequest[]>(MOCK_REQUESTS)
  const [filter, setFilter] = useState<FilterStatus>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<TenantRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const filtered = requests.filter(r => filter === 'All' || r.status === filter)
  const selected = requests.find(r => r.id === selectedId) ?? null

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    setSelectedId(null)
  }

  const openReject = (req: TenantRequest) => {
    setRejectTarget(req)
    setRejectReason('')
  }

  const confirmReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setRequests(prev => prev.map(r =>
      r.id === rejectTarget.id ? { ...r, status: 'rejected', rejectionReason: rejectReason.trim() } : r
    ))
    setRejectTarget(null)
    setSelectedId(null)
  }

  const counts: Record<FilterStatus, number> = {
    All: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Tenant Sign-Ups</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['All', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(s => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'default' : 'outline'}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
          </Button>
        ))}
      </div>

      {/* Requests table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organization</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Requested</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr
                  key={req.id}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedId(req.id)}
                >
                  <td className="px-4 py-3 font-medium">{req.orgName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{req.contactEmail}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{req.plan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{req.requestedAt}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[req.status]}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No {filter === 'All' ? '' : filter} sign-up requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.orgName}</SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selected.plan}</Badge>
                  <Badge variant={STATUS_VARIANTS[selected.status]}>
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Contact Name</p>
                    <p className="font-medium">{selected.contactName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Contact Email</p>
                    <p className="font-medium">{selected.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Requested</p>
                    <p className="font-medium">{selected.requestedAt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Plan</p>
                    <p className="font-medium">{selected.plan}</p>
                  </div>
                </div>
                {selected.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Notes from applicant</p>
                    <p className="bg-muted/50 rounded-md p-3 text-sm">{selected.notes}</p>
                  </div>
                )}
                {selected.status === 'rejected' && selected.rejectionReason && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Rejection Reason</p>
                    <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                      {selected.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
              {selected.status === 'pending' && (
                <SheetFooter className="px-4 gap-2">
                  <Button onClick={() => handleApprove(selected.id)}>Approve</Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => openReject(selected)}
                  >
                    Reject
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={open => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {rejectTarget?.orgName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejection. This will be recorded on the request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Label htmlFor="reject-reason" className="text-sm font-medium">Reason</Label>
            <textarea
              id="reject-reason"
              className="mt-1.5 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Unable to verify business registration..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!rejectReason.trim()}
              onClick={confirmReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
