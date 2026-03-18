import { useState } from 'react'
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

type StaffRole = 'professional' | 'secretary' | 'clinic_manager'

interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  branch: string
  lastLogin: string
  active: boolean
}

const MOCK_STAFF: StaffMember[] = [
  { id: '1', name: 'Dr. Sarah Kim', email: 'sarah.kim@clinic.com', role: 'professional', branch: 'Main Branch', lastLogin: '2 hours ago', active: true },
  { id: '2', name: 'John Davis', email: 'john.davis@clinic.com', role: 'secretary', branch: 'Main Branch', lastLogin: '1 day ago', active: true },
  { id: '3', name: 'Maria Lopez', email: 'maria.lopez@clinic.com', role: 'clinic_manager', branch: 'Downtown Clinic', lastLogin: '3 hours ago', active: true },
  { id: '4', name: 'Dr. James Park', email: 'james.park@clinic.com', role: 'professional', branch: 'Downtown Clinic', lastLogin: '5 days ago', active: true },
  { id: '5', name: 'Emily Chen', email: 'emily.chen@clinic.com', role: 'secretary', branch: 'Westside Location', lastLogin: '10 days ago', active: false },
]

const BRANCHES = ['Main Branch', 'Downtown Clinic', 'Westside Location']
const ROLES: StaffRole[] = ['professional', 'secretary', 'clinic_manager']

const ROLE_LABELS: Record<StaffRole, string> = {
  professional: 'Professional',
  secretary: 'Secretary',
  clinic_manager: 'Clinic Manager',
}

type SheetMode = 'invite' | 'reassign' | null

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF)
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all')
  const [branchFilter, setBranchFilter] = useState('all')

  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<StaffRole>('professional')
  const [inviteBranch, setInviteBranch] = useState(BRANCHES[0])

  // Reassign form
  const [reassignBranch, setReassignBranch] = useState(BRANCHES[0])

  const filtered = staff.filter((s) => {
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    const matchesBranch = branchFilter === 'all' || s.branch === branchFilter
    return matchesRole && matchesBranch
  })

  const handleDeactivate = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: false } : s))
  }

  const handleReassign = () => {
    if (!selectedId) return
    setStaff(prev => prev.map(s => s.id === selectedId ? { ...s, branch: reassignBranch } : s))
    setSheetMode(null)
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    setStaff(prev => [...prev, {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      branch: inviteBranch,
      lastLogin: 'Never',
      active: true,
    }])
    setSheetMode(null)
    setInviteEmail('')
    setInviteRole('professional')
    setInviteBranch(BRANCHES[0])
  }

  const openReassign = (member: StaffMember) => {
    setSelectedId(member.id)
    setReassignBranch(member.branch)
    setSheetMode('reassign')
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
            onChange={e => setRoleFilter(e.target.value as 'all' | StaffRole)}
          >
            <option value="all">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
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
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Staff table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Login</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id} className={`border-b last:border-0 ${!member.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={member.active ? 'default' : 'secondary'}>
                      {member.active ? ROLE_LABELS[member.role] : 'Deactivated'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.branch}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.lastLogin}</td>
                  <td className="px-4 py-3">
                    {member.active && (
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
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeactivate(member.id)}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-branch">Branch</Label>
              <select
                id="inv-branch"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={inviteBranch}
                onChange={e => setInviteBranch(e.target.value)}
              >
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleInvite}>Send Invite</Button>
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
                {staff.find(s => s.id === selectedId)?.name}
              </span>
            </p>
            <div className="space-y-1">
              <Label htmlFor="re-branch">New Branch</Label>
              <select
                id="re-branch"
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={reassignBranch}
                onChange={e => setReassignBranch(e.target.value)}
              >
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleReassign}>Save</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
