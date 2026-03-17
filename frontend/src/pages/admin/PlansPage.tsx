import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'

interface Plan {
  id: string
  name: string
  price: number
  storage: number
  maxBranches: number
  maxStaff: number
  status: 'Active' | 'Archived'
}

const MOCK_PLANS: Plan[] = [
  { id: '1', name: 'Starter', price: 49, storage: 10, maxBranches: 1, maxStaff: 5, status: 'Active' },
  { id: '2', name: 'Professional', price: 149, storage: 50, maxBranches: 5, maxStaff: 25, status: 'Active' },
  { id: '3', name: 'Enterprise', price: 499, storage: 200, maxBranches: 20, maxStaff: 100, status: 'Active' },
]

interface PlanFormData {
  name: string
  price: string
  storage: string
  maxBranches: string
  maxStaff: string
}

const emptyForm: PlanFormData = { name: '', price: '', storage: '', maxBranches: '', maxStaff: '' }

export function PlansPage() {
  const user = useAuthStore((s) => s.user)
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<PlanFormData>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PlanFormData>(emptyForm)
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const handleCreate = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: createForm.name,
      price: Number(createForm.price),
      storage: Number(createForm.storage),
      maxBranches: Number(createForm.maxBranches),
      maxStaff: Number(createForm.maxStaff),
      status: 'Active',
    }
    setPlans((prev) => [...prev, newPlan])
    setCreateForm(emptyForm)
    setShowCreate(false)
  }

  const handleEditOpen = (plan: Plan) => {
    setEditId(plan.id)
    setEditForm({
      name: plan.name,
      price: String(plan.price),
      storage: String(plan.storage),
      maxBranches: String(plan.maxBranches),
      maxStaff: String(plan.maxStaff),
    })
  }

  const handleEditSave = () => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === editId
          ? {
              ...p,
              name: editForm.name,
              price: Number(editForm.price),
              storage: Number(editForm.storage),
              maxBranches: Number(editForm.maxBranches),
              maxStaff: Number(editForm.maxStaff),
            }
          : p,
      ),
    )
    setEditId(null)
  }

  const handleArchive = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Archived' } : p)),
    )
    setArchiveConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
        <Button onClick={() => setShowCreate(true)}>New Plan</Button>
      </div>

      {/* Plans table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Storage (GB)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Max Branches</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Max Staff</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b last:border-0">
                  {editId === plan.id ? (
                    <>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-7 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.price}
                          onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                          className="h-7 text-sm w-20"
                          type="number"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.storage}
                          onChange={(e) => setEditForm((f) => ({ ...f, storage: e.target.value }))}
                          className="h-7 text-sm w-20"
                          type="number"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.maxBranches}
                          onChange={(e) => setEditForm((f) => ({ ...f, maxBranches: e.target.value }))}
                          className="h-7 text-sm w-20"
                          type="number"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.maxStaff}
                          onChange={(e) => setEditForm((f) => ({ ...f, maxStaff: e.target.value }))}
                          className="h-7 text-sm w-20"
                          type="number"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={plan.status === 'Active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <Button size="sm" onClick={handleEditSave}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{plan.name}</td>
                      <td className="px-4 py-3">${plan.price}/mo</td>
                      <td className="px-4 py-3">{plan.storage}</td>
                      <td className="px-4 py-3">{plan.maxBranches}</td>
                      <td className="px-4 py-3">{plan.maxStaff}</td>
                      <td className="px-4 py-3">
                        <Badge variant={plan.status === 'Active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <Button size="sm" variant="outline" onClick={() => handleEditOpen(plan)}>
                            Edit
                          </Button>
                          {archiveConfirmId === plan.id ? (
                            <span className="flex gap-1 items-center text-xs">
                              <span>Confirm?</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleArchive(plan.id)}
                              >
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setArchiveConfirmId(null)}
                              >
                                No
                              </Button>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={plan.status === 'Archived'}
                              onClick={() => setArchiveConfirmId(plan.id)}
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="new-name">Plan Name</Label>
                <Input
                  id="new-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Starter"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-price">Price ($/month)</Label>
                <Input
                  id="new-price"
                  type="number"
                  value={createForm.price}
                  onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="49"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-storage">Storage Limit (GB)</Label>
                <Input
                  id="new-storage"
                  type="number"
                  value={createForm.storage}
                  onChange={(e) => setCreateForm((f) => ({ ...f, storage: e.target.value }))}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-branches">Max Branches</Label>
                <Input
                  id="new-branches"
                  type="number"
                  value={createForm.maxBranches}
                  onChange={(e) => setCreateForm((f) => ({ ...f, maxBranches: e.target.value }))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-staff">Max Staff</Label>
                <Input
                  id="new-staff"
                  type="number"
                  value={createForm.maxStaff}
                  onChange={(e) => setCreateForm((f) => ({ ...f, maxStaff: e.target.value }))}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Save</Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm(emptyForm) }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
