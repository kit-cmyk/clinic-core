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
import { SkeletonCard } from '@/components/ui/skeleton'
import api from '@/services/api'
import { toast } from 'sonner'

interface Branch {
  id: string
  name: string
  address: string | null
  phone: string | null
  isActive: boolean
}

interface BranchForm {
  name: string
  address: string
  phone: string
}

const emptyForm: BranchForm = { name: '', address: '', phone: '' }

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null)

  const fetchBranches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/branches')
      setBranches(res.data.data as Branch[])
    } catch {
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBranches() }, [fetchBranches])

  const openAdd = () => {
    setEditBranch(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditBranch(branch)
    setForm({ name: branch.name, address: branch.address ?? '', phone: branch.phone ?? '' })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editBranch) {
        await api.put(`/api/v1/branches/${editBranch.id}`, form)
        toast.success('Branch updated')
      } else {
        await api.post('/api/v1/branches', form)
        toast.success('Branch created')
      }
      setSheetOpen(false)
      setForm(emptyForm)
      await fetchBranches()
    } catch {
      toast.error(editBranch ? 'Failed to update branch' : 'Failed to create branch')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await api.delete(`/api/v1/branches/${id}`)
      setBranches(prev => prev.filter(b => b.id !== id))
      toast.success('Branch deactivated')
    } catch {
      toast.error('Failed to deactivate branch')
    }
    setDeactivateConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Branches</h1>
        <Button onClick={openAdd}>Add Branch</Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{branch.name}</p>
                    {branch.address && (
                      <p className="text-sm text-muted-foreground">{branch.address}</p>
                    )}
                    {branch.phone && (
                      <p className="text-sm text-muted-foreground">{branch.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {deactivateConfirmId === branch.id ? (
                      <span className="flex gap-1 items-center text-xs">
                        <span>Are you sure?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDeactivate(branch.id)}>
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
                            onClick={() => setDeactivateConfirmId(branch.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                placeholder="123 Main St, New York"
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editBranch ? 'Save Changes' : 'Add Branch'}
            </Button>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
