import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF)
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<StaffRole>('professional')
  const [inviteBranch, setInviteBranch] = useState(BRANCHES[0])
  const [reassignId, setReassignId] = useState<string | null>(null)
  const [reassignBranch, setReassignBranch] = useState(BRANCHES[0])

  const filtered = staff.filter((s) => {
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    const matchesBranch = branchFilter === 'all' || s.branch === branchFilter
    return matchesRole && matchesBranch
  })

  const handleDeactivate = (id: string) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: false } : s)))
  }

  const handleReassign = (id: string) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, branch: reassignBranch } : s)))
    setReassignId(null)
  }

  const handleInvite = () => {
    setShowInvite(false)
    setInviteEmail('')
    setInviteRole('professional')
    setInviteBranch(BRANCHES[0])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Staff</h1>
        <Button onClick={() => setShowInvite(true)}>Invite Staff</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-muted-foreground mr-2">Role:</label>
          <select
            aria-label="Filter by role"
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | StaffRole)}
          >
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mr-2">Branch:</label>
          <select
            aria-label="Filter by branch"
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">All branches</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  className={`border-b last:border-0 ${!member.active ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={member.active ? 'default' : 'secondary'}>
                      {member.active ? ROLE_LABELS[member.role] : 'Deactivated'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {reassignId === member.id ? (
                      <span className="flex gap-1 items-center">
                        <select
                          className="border rounded-md px-2 py-1 text-xs bg-background"
                          value={reassignBranch}
                          onChange={(e) => setReassignBranch(e.target.value)}
                        >
                          {BRANCHES.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => handleReassign(member.id)}>OK</Button>
                        <Button size="sm" variant="outline" onClick={() => setReassignId(null)}>X</Button>
                      </span>
                    ) : (
                      member.branch
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {member.active && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setReassignId(member.id); setReassignBranch(member.branch) }}
                          >
                            Reassign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivate(member.id)}
                          >
                            Deactivate
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Staff Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@clinic.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite-branch">Branch</Label>
                <select
                  id="invite-branch"
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={inviteBranch}
                  onChange={(e) => setInviteBranch(e.target.value)}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInvite}>Send Invite</Button>
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
