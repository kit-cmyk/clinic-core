import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

interface AddForm {
  name: string
  address: string
  city: string
  phone: string
  timezone: string
}

const emptyAddForm: AddForm = { name: '', address: '', city: '', phone: '', timezone: 'UTC' }

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null)

  const handleAdd = () => {
    const newBranch: Branch = {
      id: Date.now().toString(),
      name: addForm.name,
      address: addForm.address,
      city: addForm.city,
      phone: addForm.phone,
      status: 'Active',
      staffCount: 0,
      staff: [],
    }
    setBranches((prev) => [...prev, newBranch])
    setAddForm(emptyAddForm)
    setShowAdd(false)
  }

  const handleToggleStatus = (id: string) => {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' } : b,
      ),
    )
    setDeactivateConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Branches</h1>
        <Button onClick={() => setShowAdd(true)}>Add Branch</Button>
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
                    onClick={() =>
                      setExpandedId(expandedId === branch.id ? null : branch.id)
                    }
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
                  <Button size="sm" variant="outline">Edit</Button>
                  {deactivateConfirmId === branch.id ? (
                    <span className="flex gap-1 items-center text-xs">
                      <span>Are you sure?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleToggleStatus(branch.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeactivateConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        branch.status === 'Active'
                          ? setDeactivateConfirmId(branch.id)
                          : handleToggleStatus(branch.id)
                      }
                    >
                      {branch.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                    </Button>
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

      {/* Add Branch form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add Branch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="add-name">Branch Name</Label>
                <Input
                  id="add-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Branch name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-address">Address</Label>
                <Input
                  id="add-address"
                  value={addForm.address}
                  onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-city">City</Label>
                <Input
                  id="add-city"
                  value={addForm.city}
                  onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-timezone">Timezone</Label>
                <Input
                  id="add-timezone"
                  value={addForm.timezone}
                  onChange={(e) => setAddForm((f) => ({ ...f, timezone: e.target.value }))}
                  placeholder="UTC"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Save</Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setAddForm(emptyAddForm) }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
