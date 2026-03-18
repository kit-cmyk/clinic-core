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

interface StaffMember {
  name: string
  role: string
}

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
  status: 'Active' | 'Inactive'
  staffCount: number
  staff: StaffMember[]
}

const MOCK_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'Main Branch',
    address: '123 Main St',
    city: 'New York',
    phone: '+1 555 100 0001',
    status: 'Active',
    staffCount: 8,
    staff: [
      { name: 'Dr. Sarah Kim', role: 'Professional' },
      { name: 'John Davis', role: 'Secretary' },
      { name: 'Maria Lopez', role: 'Clinic Manager' },
    ],
  },
  {
    id: '2',
    name: 'Downtown Clinic',
    address: '456 Park Ave',
    city: 'New York',
    phone: '+1 555 200 0002',
    status: 'Active',
    staffCount: 5,
    staff: [
      { name: 'Dr. James Park', role: 'Professional' },
      { name: 'Emily Chen', role: 'Secretary' },
    ],
  },
  {
    id: '3',
    name: 'Westside Location',
    address: '789 West Blvd',
    city: 'Brooklyn',
    phone: '+1 555 300 0003',
    status: 'Inactive',
    staffCount: 2,
    staff: [
      { name: 'Dr. Priya Patel', role: 'Professional' },
    ],
  },
]

interface BranchForm {
  name: string
  address: string
  city: string
  phone: string
  timezone: string
}

const emptyForm: BranchForm = { name: '', address: '', city: '', phone: '', timezone: 'UTC' }

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null)

  const openAdd = () => {
    setEditBranch(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditBranch(branch)
    setForm({ name: branch.name, address: branch.address, city: branch.city, phone: branch.phone, timezone: 'UTC' })
    setSheetOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editBranch) {
      setBranches(prev => prev.map(b => b.id === editBranch.id ? { ...b, ...form } : b))
    } else {
      setBranches(prev => [...prev, {
        id: Date.now().toString(),
        name: form.name,
        address: form.address,
        city: form.city,
        phone: form.phone,
        status: 'Active',
        staffCount: 0,
        staff: [],
      }])
    }
    setSheetOpen(false)
    setForm(emptyForm)
  }

  const handleToggleStatus = (id: string) => {
    setBranches(prev =>
      prev.map(b => b.id === id ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' } : b),
    )
    setDeactivateConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Branches</h1>
        <Button onClick={openAdd}>Add Branch</Button>
      </div>

      {/* Branch cards */}
      <div className="space-y-3">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <button
                    className="font-semibold text-foreground hover:underline text-left"
                    onClick={() => setExpandedId(expandedId === branch.id ? null : branch.id)}
                  >
                    {branch.name}
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {branch.address}, {branch.city}
                  </p>
                  <p className="text-sm text-muted-foreground">{branch.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{branch.staffCount} staff</span>
                  <Badge variant={branch.status === 'Active' ? 'default' : 'secondary'}>
                    {branch.status}
                  </Badge>
                  {deactivateConfirmId === branch.id ? (
                    <span className="flex gap-1 items-center text-xs">
                      <span>Are you sure?</span>
                      <Button size="sm" variant="destructive" onClick={() => handleToggleStatus(branch.id)}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeactivateConfirmId(null)}>
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(branch)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            branch.status === 'Active'
                              ? setDeactivateConfirmId(branch.id)
                              : handleToggleStatus(branch.id)
                          }
                          className={branch.status === 'Active' ? 'text-destructive focus:text-destructive' : ''}
                        >
                          {branch.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Expanded staff detail */}
              {expandedId === branch.id && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Assigned Staff</p>
                  {branch.staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No staff assigned.</p>
                  ) : (
                    <ul className="space-y-1">
                      {branch.staff.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="text-foreground">{s.name}</span>
                          <Badge variant="outline" className="text-xs">{s.role}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editBranch ? 'Edit Branch' : 'Add Branch'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="s-name">Branch Name</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Branch name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-phone">Phone</Label>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-address">Address</Label>
              <Input
                id="s-address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-city">City</Label>
              <Input
                id="s-city"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="New York"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-timezone">Timezone</Label>
              <Input
                id="s-timezone"
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                placeholder="UTC"
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave}>{editBranch ? 'Save Changes' : 'Add Branch'}</Button>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
