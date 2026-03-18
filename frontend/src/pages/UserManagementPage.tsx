import React, { useState, useMemo } from 'react'
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
import type { ManagedUser, Role } from '@/types'

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_STAFF: ManagedUser[] = [
  { id: 'u1', tenantId: 't1', name: 'Dr. Sarah Kim',    email: 'sarah.kim@clinic.com',    role: 'doctor',          branch: 'Main Branch',       lastLogin: '2 hours ago',  isActive: true,  type: 'staff' },
  { id: 'u2', tenantId: 't1', name: 'Dr. James Park',   email: 'james.park@clinic.com',   role: 'doctor',          branch: 'Main Branch',       lastLogin: '1 day ago',    isActive: true,  type: 'staff' },
  { id: 'u3', tenantId: 't1', name: 'Nurse Ana Santos', email: 'ana.santos@clinic.com',   role: 'nurse',           branch: 'Downtown Clinic',   lastLogin: '3 hours ago',  isActive: true,  type: 'staff' },
  { id: 'u4', tenantId: 't1', name: 'Maria Lopez',      email: 'maria.lopez@clinic.com',  role: 'branch_manager',  branch: 'Downtown Clinic',   lastLogin: '5 hours ago',  isActive: true,  type: 'staff' },
  { id: 'u5', tenantId: 't1', name: 'John Davis',       email: 'john.davis@clinic.com',   role: 'receptionist',    branch: 'Main Branch',       lastLogin: '2 days ago',   isActive: true,  type: 'staff' },
  { id: 'u6', tenantId: 't1', name: 'Dr. Liu Wei',      email: 'liu.wei@clinic.com',      role: 'doctor',          branch: 'Westside Location', lastLogin: '30 min ago',   isActive: true,  type: 'staff' },
  { id: 'u7', tenantId: 't1', name: 'Emily Chen',       email: 'emily.chen@clinic.com',   role: 'receptionist',    branch: 'Westside Location', lastLogin: '10 days ago',  isActive: false, type: 'staff' },
  { id: 'u8', tenantId: 't1', name: 'Tom Bradley',      email: 'tom.bradley@clinic.com',  role: 'lab_technician',  branch: 'Main Branch',       lastLogin: '4 hours ago',  isActive: true,  type: 'staff' },
]

const STAFF_ROLES: Role[] = ['doctor', 'nurse', 'receptionist', 'lab_technician', 'branch_manager', 'org_admin']
const BRANCHES = ['Main Branch', 'Downtown Clinic', 'Westside Location']

const ROLE_LABELS: Partial<Record<Role, string>> = {
  doctor:         'Doctor',
  nurse:          'Nurse',
  receptionist:   'Receptionist',
  lab_technician: 'Lab Tech',
  branch_manager: 'Branch Manager',
  org_admin:      'Org Admin',
  super_admin:    'Super Admin',
}

type SheetMode = 'view' | 'edit' | 'invite' | null
type EditFormState = { name: string; email: string; role: Role; branch: string; isActive: boolean }

export function UserManagementPage() {
  const [staff,      setStaff]      = useState<ManagedUser[]>(MOCK_STAFF)
  const [search,     setSearch]     = useState('')
  const [sheetMode,  setSheetMode]  = useState<SheetMode>(null)
  const [selected,   setSelected]   = useState<ManagedUser | null>(null)
  const [editForm,   setEditForm]   = useState<EditFormState>({ name: '', email: '', role: 'doctor', branch: '', isActive: true })
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'doctor' as Role, branch: BRANCHES[0] })
  const [toast,      setToast]      = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return staff.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [search, staff])

  const openView = (u: ManagedUser) => {
    setSelected(u)
    setSheetMode('view')
  }

  const openEdit = (u: ManagedUser) => {
    setSelected(u)
    setEditForm({ name: u.name, email: u.email, role: u.role as Role, branch: u.branch ?? BRANCHES[0], isActive: u.isActive })
    setSheetMode('edit')
  }

  const saveEdit = () => {
    if (!selected) return
    setStaff(prev => prev.map(u => u.id === selected.id ? { ...u, ...editForm } : u))
    setSheetMode(null)
    showToast('User updated')
  }

  const handleDelete = (id: string) => {
    setStaff(prev => prev.filter(u => u.id !== id))
    setSheetMode(null)
    showToast('User removed')
  }

  const handleInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return
    setStaff(prev => [...prev, {
      id:        `u-${Date.now()}`,
      tenantId:  't1',
      name:      inviteForm.name,
      email:     inviteForm.email,
      role:      inviteForm.role,
      branch:    inviteForm.branch,
      lastLogin: 'Never',
      isActive:  true,
      type:      'staff',
    }])
    setSheetMode(null)
    setInviteForm({ name: '', email: '', role: 'doctor', branch: BRANCHES[0] })
    showToast('Invite sent')
  }

  const activeCount = staff.filter(u => u.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} active · {staff.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {toast && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2 rounded-md">
              {toast}
            </div>
          )}
          <Button size="sm" onClick={() => setSheetMode('invite')}>+ Invite User</Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-64 h-8 text-sm"
        aria-label="Search users"
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Branch</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Login</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={`border-b last:border-0 ${!u.isActive ? 'opacity-55' : ''}`}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.branch ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.lastLogin ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'default' : 'secondary'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openView(u)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(u)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(u.id)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* View Sheet */}
      <Sheet open={sheetMode === 'view'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex-1 px-4 space-y-4 overflow-y-auto">
              <dl className="space-y-3 text-sm">
                {[
                  ['Name',       selected.name],
                  ['Email',      selected.email],
                  ['Branch',     selected.branch ?? '—'],
                  ['Last Login', selected.lastLogin ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground shrink-0">{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">Role</dt>
                  <dd><Badge variant="outline" className="text-xs">{ROLE_LABELS[selected.role] ?? selected.role}</Badge></dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">Status</dt>
                  <dd><Badge variant={selected.isActive ? 'default' : 'secondary'}>{selected.isActive ? 'Active' : 'Inactive'}</Badge></dd>
                </div>
              </dl>
            </div>
          )}
          <SheetFooter>
            <Button onClick={() => selected && openEdit(selected)}>Edit</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={sheetMode === 'edit'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={editForm.role}
                onChange={e => setEditForm(f => ({ ...f, role: e.target.value as Role }))}
                aria-label="Role"
              >
                {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Branch</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={editForm.branch}
                onChange={e => setEditForm(f => ({ ...f, branch: e.target.value }))}
                aria-label="Branch"
              >
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.isActive}
                onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border"
              />
              <label htmlFor="edit-active" className="text-sm">Active</label>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={saveEdit}>Save Changes</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Invite Sheet */}
      <Sheet open={sheetMode === 'invite'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Invite User</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input
                placeholder="e.g. Jane Doe"
                value={inviteForm.name}
                onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="jane@clinic.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as Role }))}
                aria-label="Role"
              >
                {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Branch</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={inviteForm.branch}
                onChange={e => setInviteForm(f => ({ ...f, branch: e.target.value }))}
                aria-label="Branch"
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
    </div>
  )
}
