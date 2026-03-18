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

type SheetMode = 'create' | 'edit' | null

export function PlansPage() {
  const user = useAuthStore((s) => s.user)
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS)
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanFormData>(emptyForm)

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setSheetMode('create')
  }

  const openEdit = (plan: Plan) => {
    setEditId(plan.id)
    setForm({
      name: plan.name,
      price: String(plan.price),
      storage: String(plan.storage),
      maxBranches: String(plan.maxBranches),
      maxStaff: String(plan.maxStaff),
    })
    setSheetMode('edit')
  }

  const handleSave = () => {
    if (sheetMode === 'create') {
      setPlans(prev => [...prev, {
        id: Date.now().toString(),
        name: form.name,
        price: Number(form.price),
        storage: Number(form.storage),
        maxBranches: Number(form.maxBranches),
        maxStaff: Number(form.maxStaff),
        status: 'Active',
      }])
    } else if (editId) {
      setPlans(prev => prev.map(p =>
        p.id === editId
          ? { ...p, name: form.name, price: Number(form.price), storage: Number(form.storage), maxBranches: Number(form.maxBranches), maxStaff: Number(form.maxStaff) }
          : p
      ))
    }
    setSheetMode(null)
    setForm(emptyForm)
  }

  const handleArchive = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'Archived' } : p))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
        <Button onClick={openCreate}>New Plan</Button>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} className="border-b last:border-0">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(plan)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={plan.status === 'Archived'}
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleArchive(plan.id)}
                        >
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetMode !== null} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheetMode === 'create' ? 'New Plan' : 'Edit Plan'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input id="plan-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Starter" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-price">Price ($/month)</Label>
              <Input id="plan-price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="49" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-storage">Storage Limit (GB)</Label>
              <Input id="plan-storage" type="number" value={form.storage} onChange={e => setForm(f => ({ ...f, storage: e.target.value }))} placeholder="10" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-branches">Max Branches</Label>
              <Input id="plan-branches" type="number" value={form.maxBranches} onChange={e => setForm(f => ({ ...f, maxBranches: e.target.value }))} placeholder="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-staff">Max Staff</Label>
              <Input id="plan-staff" type="number" value={form.maxStaff} onChange={e => setForm(f => ({ ...f, maxStaff: e.target.value }))} placeholder="5" />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave}>{sheetMode === 'create' ? 'Create Plan' : 'Save Changes'}</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
