import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import api from '@/services/api'
import { toast } from 'sonner'

type StaffRole = 'DOCTOR' | 'NURSE' | 'SECRETARY' | 'ORG_ADMIN' | 'BRANCH_MANAGER'

interface Branch { id: string; name: string }

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: StaffRole
  isActive: boolean
  branch: Branch | null
}

const INVITABLE_ROLES: StaffRole[] = ['DOCTOR', 'NURSE', 'SECRETARY']

const ROLE_LABELS: Record<string, string> = {
  DOCTOR:         'Doctor',
  NURSE:          'Nurse',
  SECRETARY:      'Secretary',
  ORG_ADMIN:      'Org Admin',
  BRANCH_MANAGER: 'Branch Manager',
}

type SheetMode = 'invite' | 'reassign' | null

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [branchFilter, setBranchFilter] = useState('all')

  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<StaffRole>('DOCTOR')
  const [inviteBranchId, setInviteBranchId] = useState('')

  // Reassign form
  const [reassignBranchId, setReassignBranchId] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [staffRes, branchRes] = await Promise.all([
        api.get('/api/v1/staff'),
        api.get('/api/v1/branches'),
      ])
      setStaff(staffRes.data.data as StaffMember[])
      const branchList = branchRes.data.data as Branch[]
      setBranches(branchList)
      if (branchList.length > 0) {
        setInviteBranchId(branchList[0].id)
        setReassignBranchId(branchList[0].id)
      }
    } catch {
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = staff.filter(s => {
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    const matchesBranch = branchFilter === 'all' || s.branch?.id === branchFilter
    return matchesRole && matchesBranch
  })

  const handleDeactivate = async (id: string) => {
    try {
      await api.patch(`/api/v1/staff/${id}/deactivate`)
      setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s))
      toast.success('Staff member deactivated')
    } catch {
      toast.error('Failed to deactivate staff member')
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await api.patch(`/api/v1/staff/${id}/reactivate`)
      setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: true } : s))
      toast.success('Staff member reactivated')
    } catch {
      toast.error('Failed to reactivate staff member')
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setSaving(true)
    try {
      await api.post('/api/v1/invitations', {
        email: inviteEmail,
        role: inviteRole,
        branchId: inviteBranchId || undefined,
      })
      toast.success(`Invitation sent to ${inviteEmail}`)
      setSheetMode(null)
      setInviteEmail('')
      setInviteRole('DOCTOR')
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setSaving(false)
    }
  }

  const openReassign = (member: StaffMember) => {
    setSelectedId(member.id)
    setReassignBranchId(member.branch?.id ?? (branches[0]?.id ?? ''))
    setSheetMode('reassign')
  }

  const handleReassign = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      // Branch reassignment via StaffAssignment — placeholder until backend endpoint exists
      toast.info('Branch reassignment coming in a follow-up (requires StaffAssignment API)')
      setSheetMode(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Staff</h1>
        <Button onClick={() => setSheetMode('invite')}>Invite Staff</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-muted-foreground mr-2">Role:</label>
          <select
            aria-label="Filter by role"
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mr-2">Branch:</label>
          <select
            aria-label="Filter by branch"
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
          >
            <option value="all">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-2"><SkeletonTableRow /></td></tr>
              ))}
              {!loading && filtered.map(member => (
                <tr key={member.id} className={`border-b last:border-0 ${!member.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                      {member.isActive ? (ROLE_LABELS[member.role] ?? member.role) : 'Deactivated'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.branch?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openReassign(member)}>
                          Reassign Branch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.isActive ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeactivate(member.id)}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleReactivate(member.id)}>
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invite Sheet */}
      <Sheet open={sheetMode === 'invite'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Invite Staff Member</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="inv-email">Email</Label>
              <Input
                id="inv-email"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="staff@clinic.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-role">Role</Label>
              <select
                id="inv-role"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as StaffRole)}
              >
                {INVITABLE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-branch">Branch</Label>
              <select
                id="inv-branch"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={inviteBranchId}
                onChange={e => setInviteBranchId(e.target.value)}
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleInvite} disabled={saving || !inviteEmail.trim()}>
              {saving ? 'Sending…' : 'Send Invite'}
            </Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reassign Sheet */}
      <Sheet open={sheetMode === 'reassign'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Reassign Branch</SheetTitle>
          </SheetHeader>
          <div className="flex-1 px-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Reassigning: <span className="font-medium text-foreground">
                {(() => { const m = staff.find(s => s.id === selectedId); return m ? `${m.firstName} ${m.lastName}` : '' })()}
              </span>
            </p>
            <div className="space-y-1">
              <Label htmlFor="re-branch">New Branch</Label>
              <select
                id="re-branch"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={reassignBranchId}
                onChange={e => setReassignBranchId(e.target.value)}
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleReassign} disabled={saving}>Save</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
