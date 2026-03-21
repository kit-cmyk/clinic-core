import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface MasterItem {
  id: string
  name: string
  description: string
  active: boolean
}

type TabKey = 'specialties' | 'appointment-types' | 'service-categories'

const MOCK_DATA: Record<TabKey, MasterItem[]> = {
  specialties: [
    { id: '1', name: 'General Practice', description: 'Primary care and general medicine', active: true },
    { id: '2', name: 'Cardiology', description: 'Heart and cardiovascular system', active: true },
    { id: '3', name: 'Pediatrics', description: 'Medical care for children', active: true },
    { id: '4', name: 'Orthopedics', description: 'Bones, joints, and muscles', active: false },
  ],
  'appointment-types': [
    { id: '1', name: 'Consultation', description: 'Initial or follow-up patient consultation', active: true },
    { id: '2', name: 'Follow-up', description: 'Scheduled follow-up visit', active: true },
    { id: '3', name: 'Procedure', description: 'Minor in-clinic procedure', active: true },
    { id: '4', name: 'Teleconsult', description: 'Video or phone consultation', active: true },
  ],
  'service-categories': [
    { id: '1', name: 'Diagnostic', description: 'Lab tests and imaging', active: true },
    { id: '2', name: 'Therapeutic', description: 'Treatment and therapy services', active: true },
    { id: '3', name: 'Preventive', description: 'Vaccinations and wellness checks', active: true },
    { id: '4', name: 'Surgical', description: 'Surgical procedures', active: false },
  ],
}

const TAB_LABELS: Record<TabKey, string> = {
  specialties: 'Specialties',
  'appointment-types': 'Appointment Types',
  'service-categories': 'Service Categories',
}

const TAB_SINGULAR: Record<TabKey, string> = {
  specialties: 'Specialty',
  'appointment-types': 'Appointment Type',
  'service-categories': 'Service Category',
}

interface ItemFormData {
  name: string
  description: string
}

const emptyForm: ItemFormData = { name: '', description: '' }
type SheetMode = 'create' | 'edit' | null

export function MasterDataPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<Record<TabKey, MasterItem[]>>(MOCK_DATA)
  const [activeTab, setActiveTab] = useState<TabKey>('specialties')
  const [search, setSearch] = useState('')
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ItemFormData>(emptyForm)
  const [deactivateTarget, setDeactivateTarget] = useState<{ tab: TabKey; id: string; name: string } | null>(null)

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-semibold text-lg">Access Denied</p>
      </div>
    )
  }

  const items = data[activeTab].filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setSheetMode('create')
  }

  const openEdit = (item: MasterItem) => {
    setEditId(item.id)
    setForm({ name: item.name, description: item.description })
    setSheetMode('edit')
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (sheetMode === 'create') {
      setData(prev => ({
        ...prev,
        [activeTab]: [
          ...prev[activeTab],
          { id: Date.now().toString(), name: form.name.trim(), description: form.description.trim(), active: true },
        ],
      }))
    } else if (editId) {
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item =>
          item.id === editId ? { ...item, name: form.name.trim(), description: form.description.trim() } : item
        ),
      }))
    }
    setSheetMode(null)
    setForm(emptyForm)
    setEditId(null)
  }

  const confirmDeactivate = () => {
    if (!deactivateTarget) return
    setData(prev => ({
      ...prev,
      [deactivateTarget.tab]: prev[deactivateTarget.tab].map(item =>
        item.id === deactivateTarget.id ? { ...item, active: false } : item
      ),
    }))
    setDeactivateTarget(null)
  }

  const handleReactivate = (id: string) => {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item =>
        item.id === id ? { ...item, active: true } : item
      ),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Master Data</h1>
        <Button onClick={openCreate}>Add {TAB_SINGULAR[activeTab]}</Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabKey); setSearch('') }}>
        <TabsList>
          {(Object.keys(TAB_LABELS) as TabKey[]).map(tab => (
            <TabsTrigger key={tab} value={tab}>{TAB_LABELS[tab]}</TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(TAB_LABELS) as TabKey[]).map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            <Input
              placeholder={`Search ${TAB_LABELS[tab].toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />

            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
                        <td className="px-4 py-3">
                          <Badge variant={item.active ? 'default' : 'secondary'}>
                            {item.active ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => openEdit(item)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {item.active ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeactivateTarget({ tab: activeTab, id: item.id, name: item.name })}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleReactivate(item.id)}>
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No {TAB_LABELS[tab].toLowerCase()} found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetMode !== null} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {sheetMode === 'create' ? `Add ${TAB_SINGULAR[activeTab]}` : 'Edit'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description (optional)"
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {sheetMode === 'create' ? 'Add' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Deactivate confirmation */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={open => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be marked inactive and hidden from tenant selection. Existing records using it will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
